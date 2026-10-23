// Curation: every curator whose sources have raw files runs, fragments are merged into entities.json
// and observations.json, everything is validated, and the validation report is written. Reads only
// data/raw/; deterministic, so a rebuild reproduces the checksums exactly.
import { Entities } from '../../app/src/model/entities';
import type { Entity, Manifest, Observation } from '../../app/src/model/schema';
import { json } from '../lib/files';
import type { Fragment } from '../lib/types';
import { checkNoDefaults } from '../validation/no-defaults';
import { checkEntities, checkObservations } from '../validation/observations';
import { newReport, type Report } from '../validation/report';
import { curateAttribution } from './attribution';

export interface CurateContext { release: string; curatedDir: string; fixturesDir: string; manifest: Manifest }

export interface Curator {
  name: string;
  needs: string[];
  run(ctx: CurateContext, fragmentsSoFar: readonly Fragment[]): Promise<Fragment>;
}

export interface Curated { files: { path: string; text: string; sources: string[] }[]; report: Report }

const hasRaw = (m: Manifest, name: string) => (m.sources.find((s) => s.name === name)?.raw?.length ?? 0) > 0;

export const curateAll = async (manifest: Manifest, curators: readonly Curator[]): Promise<Curated> => {
  const release = manifest.atlas_release;
  const ctx: CurateContext = { release, curatedDir: `data/curated/${release}`, fixturesDir: 'tests/fixtures', manifest };
  const report = newReport(release);
  const fragments: Fragment[] = [];
  const contributors = new Set<string>();
  for (const c of curators) {
    if (!c.needs.every((n) => hasRaw(manifest, n))) { report.sections[c.name] = { skipped: `waiting for ${c.needs.filter((n) => !hasRaw(manifest, n)).join(', ')}` }; continue; }
    const f = await c.run(ctx, fragments);
    fragments.push(f);
    report.sections[c.name] = f.report;
    if (f.entities.length || f.observations.length || f.relationsOnOthers.length) c.needs.forEach((n) => contributors.add(n));
  }

  const byId = new Map<string, Entity>();
  for (const f of fragments) for (const e of f.entities) {
    if (byId.has(e.id)) report.rejections.push(`${e.id}: created by two curators`);
    byId.set(e.id, e);
  }
  for (const f of fragments) for (const r of f.relationsOnOthers) {
    const holder = byId.get(r.source);
    if (!holder) { report.rejections.push(`${r.source} ${r.predicate} ${r.target}: the holding entity does not exist`); continue; }
    byId.set(r.source, { ...holder, relations: [...holder.relations, r] });
  }
  const entities = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const observations: Observation[] = fragments.flatMap((f) => f.observations).sort((a, b) => a.id.localeCompare(b.id));

  report.rejections.push(...checkEntities(entities), ...checkObservations(observations));
  report.rejections.push(...checkNoDefaults(fragments.flatMap((f) => f.rawValues), observations));
  try { new Entities(entities as never); } catch (e) { report.rejections.push(String((e as Error).message)); }
  const ids = new Set(entities.map((e) => e.id));
  for (const o of observations) if (!ids.has(o.subject)) report.rejections.push(`${o.id}: observes an entity that does not exist`);

  const sources = [...contributors].sort();
  const files: Curated['files'] = [];
  if (entities.length) {
    files.push({ path: `${ctx.curatedDir}/entities.json`, text: json(entities), sources });
    files.push({ path: `${ctx.curatedDir}/observations.json`, text: json(observations), sources });
  }
  for (const f of fragments) files.push(...f.files);
  files.push(...curateAttribution(manifest, ctx.curatedDir).files);
  report.sections.counts = { entities: entities.length, observations: observations.length, files: files.length + 1 };
  files.push({ path: `${ctx.curatedDir}/validation-report.json`, text: json(report), sources: manifest.sources.filter((s) => hasRaw(manifest, s.name)).map((s) => s.name) });
  return { files, report };
};
