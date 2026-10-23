// The shared-names test release (T092): 001-prototype's curated files, with only the ephemerides of
// Earth and Mercury, plus a second entity named "Mercury" of another kind: the element, transcribed
// from the PubChem periodic table 001-prototype already holds (data/raw/001-prototype/pubchem/). No
// network, deterministic; marked `test_release: true` so the application shows it only under ?test.
//
//   npx tsx ingest/test-release.ts
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { parse, stringify } from 'yaml';
import { ManifestSchema, type Entity, type Manifest, type Observation } from '../app/src/model/schema';
import { fileSha, json, writeBytes } from './lib/files';
import { RAW } from './sources/pubchem';

const FROM = '001-prototype';
const TO = 'shared-names';
const KEEP_EPHEMERIDES = ['earth.json', 'mercury.json'];
const ELEMENT = { z: 80, id: 'atlas:element-hg' } as const;

const main = async () => {
  const from = ManifestSchema.parse(parse(await readFile(`data/manifests/${FROM}.yaml`, 'utf8'))) as Manifest;
  const dir = `data/curated/${TO}`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(`${dir}/ephemeris`, { recursive: true });

  const pubchem = from.sources.find((s) => s.name === 'pubchem');
  if (!pubchem?.retrieval_time) throw new Error('001-prototype has no PubChem snapshot to transcribe the element from');
  const table = JSON.parse(await readFile(`data/raw/${FROM}/pubchem/${RAW.periodicTable}`, 'utf8')) as { Table: { Columns: { Column: string[] }; Row: { Cell: string[] }[] } };
  const cols = table.Table.Columns.Column;
  const row = table.Table.Row.find((r) => r.Cell[cols.indexOf('AtomicNumber')] === String(ELEMENT.z));
  if (!row) throw new Error(`the periodic table has no row for element ${ELEMENT.z}`);
  const name = row.Cell[cols.indexOf('Name')] as string;
  const symbol = row.Cell[cols.indexOf('Symbol')] as string;
  const source = { dataset: 'pubchem' as const, release: String(pubchem.source_release), record: `periodic table: AtomicNumber ${ELEMENT.z}, ${name}`, retrieved: pubchem.retrieval_time };
  const obsId = `obs:pubchem:element-${ELEMENT.z}:atomicNumber`;
  const element: Entity = { id: ELEMENT.id, kind: 'AtomType', names: { canonical: name, aliases: [symbol], catalogue: [], source }, classifications: [], relations: [], evidence: [obsId] };
  const observation: Observation = { id: obsId, subject: ELEMENT.id, property: 'atomicNumber', value: Number(row.Cell[cols.indexOf('AtomicNumber')]), unit: 'dimensionless', source };

  const entities = (JSON.parse(await readFile(`data/curated/${FROM}/entities.json`, 'utf8')) as Entity[]).concat(element).sort((a, b) => a.id.localeCompare(b.id));
  const observations = (JSON.parse(await readFile(`data/curated/${FROM}/observations.json`, 'utf8')) as Observation[]).concat(observation).sort((a, b) => a.id.localeCompare(b.id));
  await writeBytes(`${dir}/entities.json`, json(entities));
  await writeBytes(`${dir}/observations.json`, json(observations));
  for (const f of ['attribution.json', 'elements.json', 'molecules.json', 'precision.json', 'stars.json']) await copyFile(`data/curated/${FROM}/${f}`, `${dir}/${f}`);
  for (const f of KEEP_EPHEMERIDES) await copyFile(`data/curated/${FROM}/ephemeris/${f}`, `${dir}/ephemeris/${f}`);
  await writeBytes(`${dir}/README.md`, `A test release derived from ${FROM} by ingest/test-release.ts: only Earth's and Mercury's ephemerides, and the element ${name} beside the planet, so that one name is shared by two entities. Shown only under ?test.\n`);

  const sources = await Promise.all(from.sources.map(async (s) => {
    const curated = [];
    for (const c of s.curated ?? []) {
      const file = c.file.replace(`data/curated/${FROM}/`, `${dir}/`);
      try { curated.push({ file, sha256: await fileSha(file) }); } catch { /* left out of the test release */ }
    }
    return { ...s, curated };
  }));
  const manifest: Manifest = {
    atlas_release: TO, test_release: true, generated_at: from.generated_at, reproducible: true,
    units_policy: from.units_policy, window: from.window, sources, validation_report: from.validation_report,
  };
  await writeBytes(`data/manifests/${TO}.yaml`, `# A test release: derived from ${FROM} by ingest/test-release.ts, never shown outside ?test.\n${stringify(ManifestSchema.parse(manifest), { lineWidth: 0 })}`);
  console.log(`test release ${TO}: ${entities.length} entities, "${name}" shared by ${entities.filter((e) => e.names.canonical === name).length}`);
};

await main();
