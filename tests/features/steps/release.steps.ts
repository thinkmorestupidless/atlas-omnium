// Steps of features/release/release.feature: the rebuild runs in Node, without the network, against
// the committed manifest and raw snapshots, and against a copy with one field unfilled.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import { parseDocument } from 'yaml';
import { Given, Then, When } from './world';

interface Run { status: number | null; out: string }
const memo: { manifest?: string; run?: Run; field?: string } = {};

const rebuild = (manifest: string): Run => {
  const r = spawnSync('npx', ['tsx', 'ingest/rebuild.ts', manifest], { encoding: 'utf8', timeout: 300_000 });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
};

// playwright-bdd reads fixtures from the first parameter; this step needs none.
// eslint-disable-next-line no-empty-pattern
Given('the manifest of the release {string} and its raw snapshots', async ({}, release: string) => {
  const path = `data/manifests/${release}.yaml`;
  const doc = parseDocument(readFileSync(path, 'utf8')).toJS() as { sources: { raw: { file: string }[] | null }[] };
  for (const s of doc.sources) for (const r of s.raw ?? []) expect(existsSync(r.file), r.file).toBe(true);
  memo.manifest = path;
});

When('the curated data is rebuilt without the network', async () => {
  memo.run = rebuild(memo.manifest as string);
});

Then('the curated data matches the checksums in the manifest', async () => {
  expect(memo.run?.out).toMatch(/reproduced: \d+ curated files match the manifest, without the network/);
  expect(memo.run?.status).toBe(0);
});

Given('a manifest with a field that is unfilled', async () => {
  const doc = parseDocument(readFileSync('data/manifests/001-prototype.yaml', 'utf8'));
  doc.setIn(['sources', 0, 'retrieval_time'], null);
  doc.delete('reproducible');
  const dir = mkdtempSync(join(tmpdir(), 'atlas-unfilled-'));
  memo.manifest = join(dir, '001-prototype.yaml');
  memo.field = 'sources[0].retrieval_time';
  writeFileSync(memo.manifest, doc.toString({ lineWidth: 0 }));
});

When('the release is built', async () => {
  memo.run = rebuild(memo.manifest as string);
});

Then('the release is not called reproducible', async () => {
  expect(memo.run?.status).not.toBe(0);
  expect(memo.run?.out).toContain('is not reproducible');
});

Then('the unfilled field is named', async () => {
  expect(memo.run?.out).toContain(`${memo.field} is unfilled`);
});
