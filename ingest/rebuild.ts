// Rebuild a release's curated files from its raw snapshots without the network, and compare every
// checksum with the manifest. Exits non-zero, naming the field or the file, when the release is not
// reproducible.
import { readFile } from 'node:fs/promises';
import { parseManifest } from '../app/src/model/release';
import type { Manifest } from '../app/src/model/schema';
import { curateAll } from './curate/index';
import { disableNetwork } from './lib/http';
import { sha256, writeBytes } from './lib/files';
import { CURATORS } from './registry';
import { checkManifest } from './validation/manifest';

export interface RebuildResult { ok: boolean; problems: string[]; files: number }

export const verifyRebuild = async (m: Manifest, opts: { write?: boolean } = {}): Promise<RebuildResult> => {
  const check = checkManifest(m);
  if (!check.reproducible) return { ok: false, problems: [`release ${m.atlas_release} is not reproducible: ${check.unfilled} is unfilled`], files: 0 };
  disableNetwork();
  const { files, report } = await curateAll(m, CURATORS);
  const problems = [...report.rejections.map((r) => `rejected: ${r}`)];
  const listed = new Map<string, string>();
  for (const s of m.sources) for (const c of s.curated ?? []) listed.set(c.file, c.sha256);
  const produced = new Set<string>();
  for (const f of files) {
    produced.add(f.path);
    const want = listed.get(f.path);
    if (!want) problems.push(`${f.path}: produced but not in the manifest`);
    else if (want !== sha256(f.text)) problems.push(`${f.path}: checksum differs from the manifest`);
  }
  for (const p of listed.keys()) if (!produced.has(p)) problems.push(`${p}: in the manifest but not produced`);
  if (problems.length === 0 && opts.write) for (const f of files) await writeBytes(f.path, f.text);
  return { ok: problems.length === 0, problems, files: files.length };
};

const main = async () => {
  const path = process.argv[2];
  if (!path) throw new Error('usage: rebuild.ts <manifest>');
  const m = parseManifest(await readFile(path, 'utf8'));
  const r = await verifyRebuild(m, { write: true });
  if (!r.ok) {
    for (const p of r.problems) console.error(p);
    console.error(`release ${m.atlas_release} is not reproducible`);
    process.exit(1);
  }
  console.log(`release ${m.atlas_release} reproduced: ${r.files} curated files match the manifest, without the network`);
};

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(2); });
