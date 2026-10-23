// Loading a release: the manifest first, then every curated file it lists, each validated against
// its schema. A release that is not reproducible is refused unless the caller explicitly allows it
// (development and the feature harness before ingest has finished, and the screen says so).
import { parse as parseYaml } from 'yaml';
import { Entities } from './entities';
import { Observations } from './observations';
import type { Model } from './derived';
import {
  AttributionFileSchema, ElementsFileSchema, EntitiesFileSchema, EphemerisFileSchema, ManifestSchema, MoleculesFileSchema,
  ObservationsFileSchema, PrecisionFileSchema, StarsFileSchema,
} from './schema';
import type { EphemerisFile, Manifest } from './schema';

export type FetchText = (path: string) => Promise<string>;

export class UnreproducibleRelease extends Error {
  constructor(readonly release: string, readonly unfilled: string | null) {
    super(`release ${release} is not reproducible${unfilled ? `: ${unfilled} is unfilled` : ''}`);
  }
}

export interface LoadOptions { allowUnreproducible?: boolean; allowTestRelease?: boolean }

/** The first unfilled field of a manifest, as a dotted path, or null when every field is filled. */
export const firstUnfilled = (m: Manifest): string | null => {
  const walk = (v: unknown, path: string): string | null => {
    if (v === null) return path;
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) { const r = walk(v[i], `${path}[${i}]`); if (r) return r; } return null; }
    if (typeof v === 'object') { for (const [k, x] of Object.entries(v as object)) { const r = walk(x, path ? `${path}.${k}` : k); if (r) return r; } }
    return null;
  };
  return walk(m, '');
};

export const parseManifest = (text: string): Manifest => ManifestSchema.parse(parseYaml(text));

const curatedPaths = (m: Manifest): string[] => {
  const all = new Set<string>();
  for (const s of m.sources) for (const c of s.curated ?? []) all.add(c.file);
  return [...all];
};

export const loadRelease = async (release: string, fetchText: FetchText, opts: LoadOptions = {}): Promise<Model> => {
  const manifest = parseManifest(await fetchText(`manifests/${release}.yaml`));
  if (manifest.atlas_release !== release) throw new Error(`manifest names ${manifest.atlas_release}, not ${release}`);
  const testRelease = manifest.test_release === true;
  if (testRelease && !opts.allowTestRelease) throw new Error(`${release} is a test release and is not served to a person`);
  const reproducible = manifest.reproducible === true;
  if (!reproducible && !opts.allowUnreproducible) throw new UnreproducibleRelease(release, firstUnfilled(manifest));

  const files = curatedPaths(manifest);
  const prefix = `curated/${release}/`;
  const texts = new Map<string, string>();
  // Files outside the release's curated directory (the held-out samples under tests/fixtures/) are
  // for the suites, not the application.
  await Promise.all(files.map(async (f) => {
    const rel = f.replace(/^data\//, '');
    if (!rel.startsWith(prefix)) return;
    texts.set(rel.slice(prefix.length), await fetchText(rel));
  }));
  const json = (name: string): unknown => {
    const t = texts.get(name);
    return t === undefined ? undefined : JSON.parse(t);
  };
  const ephemerides = new Map<string, EphemerisFile>();
  for (const [name, text] of texts) {
    if (!name.startsWith('ephemeris/')) continue;
    const f = EphemerisFileSchema.parse(JSON.parse(text));
    ephemerides.set(f.subject, f);
  }
  const stars = json('stars.json');
  const precision = PrecisionFileSchema.parse(json('precision.json') ?? []);
  return {
    release: { name: release, manifest, reproducible, testRelease, window: { from: manifest.window.from, to: manifest.window.to } },
    entities: new Entities(EntitiesFileSchema.parse(json('entities.json') ?? [])),
    observations: new Observations(ObservationsFileSchema.parse(json('observations.json') ?? [])),
    ephemerides,
    elements: ElementsFileSchema.parse(json('elements.json') ?? []),
    stars: stars === undefined ? null : StarsFileSchema.parse(stars),
    molecules: MoleculesFileSchema.parse(json('molecules.json') ?? []),
    precision: new Map(precision.map((p) => [p.subject, p])),
    attribution: AttributionFileSchema.parse(json('attribution.json') ?? []),
  };
};
