import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { ECLIPTIC_J2000 } from '../../app/src/model/frames';
import { atomPosition, conformerFrame } from '../../app/src/model/molecules';
import { loadRelease } from '../../app/src/model/release';
import { ConformerSchema } from '../../app/src/model/schema';
import { offPlane } from '../../app/src/projections/conformer-plane';

const fixture = async () => JSON.parse(await readFile('tests/fixtures/water-record.json', 'utf8')) as {
  atoms: { aid: number[]; element: number[] }; bonds: { aid1: number[]; aid2: number[]; order: number[] }; conformer: { x: number[]; y: number[]; z: number[] };
};
const release = () => loadRelease('001-prototype', (p) => readFile(`data/${p}`, 'utf8'));

describe('the water conformer', () => {
  it('has the record\'s three atoms, elements 1, 1 and 8, and two bonds', async () => {
    const f = await fixture();
    const m = await release();
    const c = m.molecules.find((x) => x.molecule === 'atlas:pubchem-962');
    expect(c).toBeDefined();
    expect([...f.atoms.element].sort((a, b) => a - b)).toEqual([1, 1, 8]);
    expect(c?.atoms.map((a) => a.element).sort()).toEqual(['atlas:element-h', 'atlas:element-h', 'atlas:element-o']);
    expect(c?.bonds).toHaveLength(2);
    expect(c?.bonds).toHaveLength(f.bonds.aid1.length);
    for (const [k, aid] of f.atoms.aid.entries()) {
      expect(c?.atoms.find((a) => a.index === aid)?.position).toEqual([f.conformer.x[k], f.conformer.y[k], f.conformer.z[k]]);
    }
  });

  it('places atoms in a molecular frame that carries the PubChem record, never a celestial frame', async () => {
    const c = (await release()).molecules[0];
    if (!c) throw new Error('no conformer');
    const p = atomPosition(c, 1);
    expect(p?.frame).toEqual(conformerFrame(c));
    expect(p?.frame.source.dataset).toBe('pubchem');
    expect(p?.unit).toBe('angstrom');
    expect(() => ConformerSchema.parse({ ...c, frame: ECLIPTIC_J2000 })).toThrow();
  });

  it('gives the counts 2 and 1 through the hasPart relationships', async () => {
    const m = await release();
    const parts = m.entities.outgoing('atlas:pubchem-962' as never, 'hasPart');
    expect(Object.fromEntries(parts.map((r) => [r.target, r.count]))).toEqual({ 'atlas:element-h': 2, 'atlas:element-o': 1 });
    expect(parts.every((r) => r.status === 'observed')).toBe(true);
  });

  it('is planar: no atom lies more than 1e-6 Å off its best-fit plane', async () => {
    const c = (await release()).molecules[0];
    if (!c) throw new Error('no conformer');
    for (const d of offPlane(c)) expect(d.value).toBeLessThan(1e-6);
  });
});
