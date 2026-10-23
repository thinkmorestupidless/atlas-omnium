import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadRelease, UnreproducibleRelease } from '../../app/src/model/release';
import { IDS } from '../../app/src/model/ids';

const root = 'tests/fixtures/release-minimal';
const fetchText = (p: string) => readFile(join(root, p), 'utf8');

describe('loading a release', () => {
  it('loads every curated file the manifest lists, validated', async () => {
    const m = await loadRelease('mini', fetchText);
    expect(m.release.reproducible).toBe(true);
    expect(m.entities.name(IDS.halley)).toBe('1P/Halley');
    expect(m.observations.measured(IDS.halley, 'meanRadius').value).toBeNull();
  });

  it('refuses a release that is not reproducible, naming the unfilled field', async () => {
    await expect(loadRelease('mini-unfilled', fetchText)).rejects.toThrow(UnreproducibleRelease);
    await expect(loadRelease('mini-unfilled', fetchText)).rejects.toThrow(/generated_at is unfilled/);
  });

  it('loads it when explicitly allowed, and says it is not reproducible', async () => {
    const m = await loadRelease('mini-unfilled', fetchText, { allowUnreproducible: true });
    expect(m.release.reproducible).toBe(false);
    // its manifest lists the mini release's files, which are outside its own curated directory
    expect(m.entities.all()).toHaveLength(0);
  });
});
