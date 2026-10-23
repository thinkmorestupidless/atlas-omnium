import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { loadRelease } from '../../app/src/model/release';
import { searchNames } from '../../app/src/model/search';

const release = () => loadRelease('001-prototype', (p) => readFile(`data/${p}`, 'utf8'));

describe('search over names', () => {
  it('matches a canonical name whatever its case', async () => {
    const m = await release();
    for (const q of ['Mars', 'mars', 'MARS']) expect(searchNames(m, q).map((x) => x.id)).toEqual(['atlas:mars']);
  });
  it('matches an alias, and gives the canonical name', async () => {
    const m = await release();
    const r = searchNames(m, 'alpha centauri c');
    expect(r).toHaveLength(1);
    expect(r[0]?.name).toBe('Proxima Centauri');
    expect(r[0]?.kind).toBe('Star');
  });
  it('matches by prefix and offers every match with its kind', async () => {
    const m = await release();
    const r = searchNames(m, 'alpha');
    expect(r.length).toBeGreaterThan(1);
    expect(r.map((x) => x.name)).toContain('Proxima Centauri');
    for (const x of r) expect(x.kind).toBeTruthy();
  });
  it('finds a substance, a molecule type and an atom type', async () => {
    const m = await release();
    expect(searchNames(m, 'water').map((x) => x.kind)).toEqual(['Substance']);
    expect(searchNames(m, 'H2O').map((x) => x.id)).toEqual(['atlas:pubchem-962']);
    expect(searchNames(m, 'oxygen').map((x) => x.id)).toEqual(['atlas:element-o']);
  });
  it('returns nothing for a name the release does not hold, and for an empty query', async () => {
    const m = await release();
    expect(searchNames(m, 'Betelgeuse')).toEqual([]);
    expect(searchNames(m, '   ')).toEqual([]);
  });
});

describe('the shared-names test release', () => {
  const load = (opts = {}) => loadRelease('shared-names', (p) => readFile(`data/${p}`, 'utf8'), opts);
  it('is refused outside the test mode', async () => {
    await expect(load()).rejects.toThrow(/test release/);
  });
  it('holds two entities named Mercury of different kinds, the element transcribed from PubChem', async () => {
    const m = await load({ allowTestRelease: true });
    expect(m.release.testRelease).toBe(true);
    const r = searchNames(m, 'Mercury');
    expect(r.map((x) => x.kind).sort()).toEqual(['AtomType', 'Planet']);
    const hg = m.entities.get('atlas:element-hg' as never);
    expect(hg?.names.source?.dataset).toBe('pubchem');
    expect(m.observations.measured('atlas:element-hg' as never, 'atomicNumber').value).toBe(80);
  });
});
