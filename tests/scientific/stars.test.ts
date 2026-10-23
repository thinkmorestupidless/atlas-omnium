import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { icrsToEcliptic } from '../../app/src/model/frames';
import { distanceFromParallax, icrsCartesian, starStates } from '../../app/src/model/parallax';
import { loadRelease } from '../../app/src/model/release';
import { ObservationSchema } from '../../app/src/model/schema';

interface Row { source_id: string; ra: number; dec: number; parallax: number; parallax_error: number; reference: { distancePc: number; intervalPc: [number, number]; icrsPc: number[]; eclipticJ2000Pc: number[] } }
const fixture = async (): Promise<{ rows: Row[] }> => JSON.parse(await readFile('tests/fixtures/star-sample-tiny.json', 'utf8'));
const release = () => loadRelease('001-prototype', (p) => readFile(`data/${p}`, 'utf8'));
const TOL_PC = 1e-6;

describe('Gaia rows to positions', () => {
  it('converts (ra, dec, derived distance) to ICRS Cartesian and to the ecliptic as an independent computation does', async () => {
    for (const r of (await fixture()).rows) {
      const d = distanceFromParallax(ObservationSchema.parse({
        id: `obs:gaia:${r.source_id}:parallax`, subject: `atlas:gaia-dr3-${r.source_id}`, property: 'parallax', value: r.parallax, unit: 'mas',
        uncertainty: { kind: 'stddev', sigma: r.parallax_error }, epoch: { scale: 'TCB', jd: 2457389.0 },
        source: { dataset: 'gaia', release: 'Gaia DR3', record: `source_id ${r.source_id}`, retrieved: '2026-10-23T00:00:00Z' },
      }));
      expect(Math.abs((d.value?.value ?? NaN) - r.reference.distancePc)).toBeLessThan(TOL_PC);
      const u = d.uncertainty;
      if (u?.kind !== 'interval') throw new Error('the distance range is an interval');
      expect(Math.abs(u.low - r.reference.intervalPc[0])).toBeLessThan(TOL_PC);
      expect(Math.abs(u.high - r.reference.intervalPc[1])).toBeLessThan(TOL_PC);
      const icrs = icrsCartesian(r.ra, r.dec, d.value?.value ?? NaN);
      const ecl = icrsToEcliptic(icrs);
      for (let k = 0; k < 3; k++) {
        expect(Math.abs(icrs[k]! - r.reference.icrsPc[k]!)).toBeLessThan(TOL_PC);
        expect(Math.abs(ecl[k]! - r.reference.eclipticJ2000Pc[k]!)).toBeLessThan(TOL_PC);
      }
    }
  });
});

describe('the curated star sample', () => {
  it('has the criteria and the query the manifest records', async () => {
    const m = await release();
    const manifest = parse(await readFile('data/manifests/001-prototype.yaml', 'utf8'));
    const gaia = manifest.sources.find((s: { name: string }) => s.name === 'gaia');
    expect(m.stars?.sample.query).toBe(gaia.query.adql);
    expect(m.stars?.sample.criteria).toEqual(gaia.query.criteria);
  });

  it('has every member as an entity, with a position', async () => {
    const m = await release();
    const states = starStates(m);
    for (const id of m.stars?.sample.members ?? []) {
      expect(m.entities.get(id as never), id).toBeDefined();
      expect(states.get(id as never)?.position, id).not.toBeNull();
    }
    expect(m.stars?.sample.members).toContain('atlas:gaia-dr3-5853498713190525696');
  });

  it('has two records and a basis on every cross-match, and no Gaia identifier only where the report records the absence', async () => {
    const m = await release();
    const report = JSON.parse(await readFile('data/curated/001-prototype/validation-report.json', 'utf8'));
    const lacks = new Set((report.sections.stars.hipparcos2Decisions as string[]).filter((d) => d.includes('Gaia DR3 lacks it')).map((d) => `atlas:hip-${d.match(/^HIP (\d+)/)?.[1]}`));
    expect(m.stars?.crossMatches.length).toBeGreaterThan(0);
    for (const c of m.stars?.crossMatches ?? []) {
      expect(c.records).toHaveLength(2);
      expect(c.records.map((r) => r.dataset).sort()).toEqual(['hipparcos2', 'simbad']);
      expect(c.basis).toBeTruthy();
      if (c.gaiaDr3 === null) expect(lacks.has(c.entity), c.entity).toBe(true);
      expect(m.stars?.sample.members).toContain(c.entity);
    }
  });
});
