// Acquire every source a manifest names (or only those given with --only), keep the raw responses,
// curate, fill the manifest, and verify by rebuilding without the network. `reproducible: true` is
// written last and only when that rebuild matches.
import { readFile, writeFile } from 'node:fs/promises';
import { parseDocument } from 'yaml';
import { ManifestSchema } from '../app/src/model/schema';
import { curateAll } from './curate/index';
import { makeHttp } from './lib/http';
import { fileSha, sha256, writeBytes } from './lib/files';
import { CURATORS, SOURCES } from './registry';
import { verifyRebuild } from './rebuild';
import { checkManifest } from './validation/manifest';

const RATE: Record<string, number> = {
  'ssd.jpl.nasa.gov': 400, 'ssd-api.jpl.nasa.gov': 400, 'pubchem.ncbi.nlm.nih.gov': 250,
  'gea.esac.esa.int': 1000, 'tapvizier.cds.unistra.fr': 1000, 'simbad.cds.unistra.fr': 1000,
};

const main = async () => {
  const [path, ...rest] = process.argv.slice(2);
  if (!path) throw new Error('usage: run.ts <manifest> [--only <source>...]');
  const only = rest[0] === '--only' ? rest.slice(1) : null;
  const doc = parseDocument(await readFile(path, 'utf8'));
  const manifest = () => ManifestSchema.parse(doc.toJS());
  const release = manifest().atlas_release;
  const http = makeHttp(RATE);

  const sources = manifest().sources;
  for (let i = 0; i < sources.length; i++) {
    const name = sources[i]?.name ?? '';
    if (only && !only.includes(name)) continue;
    const mod = SOURCES[name];
    if (!mod) { if (only) throw new Error(`no source module for ${name}`); console.warn(`skip ${name}: no source module yet`); continue; }
    console.log(`acquire ${name}`);
    const a = await mod.acquire({ release, rawDir: `data/raw/${release}/${name}`, http });
    const at = (k: string, v: unknown) => doc.setIn(['sources', i, k], doc.createNode(v));
    at('query', a.query);
    at('retrieval_time', new Date().toISOString());
    at('source_release', a.source_release);
    if (a.api_version !== undefined) at('api_version', a.api_version);
    at('licence', a.licence);
    at('attribution', a.attribution);
    at('citation', a.citation);
    at('terms_pages', a.terms_pages);
    at('raw', await Promise.all(a.raw.sort().map(async (file) => ({ file, sha256: await fileSha(file) }))));
  }

  console.log('curate');
  const { files, report } = await curateAll(manifest(), CURATORS);
  for (const f of files) await writeBytes(f.path, f.text);
  const all = manifest().sources;
  for (let i = 0; i < all.length; i++) {
    const name = all[i]?.name ?? '';
    const mine = files.filter((f) => f.sources.includes(name)).map((f) => ({ file: f.path, sha256: sha256(f.text) }));
    doc.setIn(['sources', i, 'curated'], doc.createNode(mine.length ? mine : null));
  }
  doc.set('generated_at', new Date().toISOString());
  doc.set('validation_report', `data/curated/${release}/validation-report.json`);
  doc.delete('reproducible');

  const check = checkManifest(manifest());
  let reproducible = false;
  if (check.reproducible && report.rejections.length === 0) {
    const r = await verifyRebuild(manifest());
    reproducible = r.ok;
    if (!r.ok) r.problems.forEach((p) => console.error(p));
  }
  if (reproducible) doc.set('reproducible', true);
  await writeFile(path, doc.toString({ lineWidth: 0 }));
  for (const r of report.rejections) console.error(`rejected: ${r}`);
  console.log(reproducible ? `release ${release} is reproducible` : `release ${release} is not reproducible yet: ${check.unfilled ?? `${report.rejections.length} rejections`}`);
};

main().catch((e) => { console.error(e); process.exit(1); });
