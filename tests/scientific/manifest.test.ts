import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseManifest } from '../../app/src/model/release';
import { checkManifest } from '../../ingest/validation/manifest';

const zeros = '0'.repeat(64);
const base = readFileSync('tests/fixtures/release-minimal/manifests/mini.yaml', 'utf8')
  .replace('raw: []', `raw: [{ file: data/raw/mini/fixture.txt, sha256: "${zeros}" }]`);

describe('the manifest check', () => {
  it('calls a fully filled manifest reproducible', () => {
    expect(checkManifest(parseManifest(base))).toEqual({ unfilled: null, reproducible: true });
  });

  it('does not call a source with no raw files reproducible', () => {
    const r = checkManifest(parseManifest(base.replace(/raw: \[.*\]/, 'raw: []')));
    expect(r).toEqual({ unfilled: 'sources[0] (fixture) has no files', reproducible: false });
  });

  it('names the unfilled field and does not call the release reproducible', () => {
    const m = parseManifest(base.replace('retrieval_time: 2026-10-23T00:00:00Z', 'retrieval_time: null'));
    const r = checkManifest(m);
    expect(r.reproducible).toBe(false);
    expect(r.unfilled).toBe('sources[0].retrieval_time');
  });
});
