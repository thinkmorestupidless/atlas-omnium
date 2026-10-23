import { describe, expect, it } from 'vitest';
import { distanceFromParallax } from '../../app/src/model/parallax';
import { ObservationSchema } from '../../app/src/model/schema';

const source = { dataset: 'gaia', release: 'Gaia DR3', record: 'source_id 5853498713190525696', retrieved: '2026-10-23T00:00:00Z' } as const;
const epoch = { scale: 'TCB', jd: 2457389.0 } as const;
const parallax = (value: number | null, sigma?: number) => ObservationSchema.parse({
  id: 'obs:gaia:5853498713190525696:parallax', subject: 'atlas:gaia-dr3-5853498713190525696', property: 'parallax', value, unit: 'mas', source,
  ...(value === null ? {} : { epoch }), ...(sigma === undefined ? {} : { uncertainty: { kind: 'stddev', sigma } }),
});

describe('inverse parallax', () => {
  it('gives the distance with the range the parallax ±1σ implies, derived, naming the model and the observation', () => {
    const d = distanceFromParallax(parallax(768.07, 0.05));
    expect(d.value?.unit).toBe('pc');
    expect(d.value?.value).toBeCloseTo(1.3020, 4);
    const u = d.uncertainty;
    if (u?.kind !== 'interval') throw new Error('the distance range is an interval');
    expect(u.low).toBeCloseTo(1000 / 768.12, 12);
    expect(u.high).toBeCloseTo(1000 / 768.02, 12);
    expect(d.status).toBe('derived');
    expect(d.model.name).toBe('inverse-parallax');
    expect(d.from).toEqual(['obs:gaia:5853498713190525696:parallax']);
  });

  it('gives a missing distance for a missing parallax', () => {
    const d = distanceFromParallax(parallax(null));
    expect(d.value).toBeNull();
    expect(d.uncertainty).toBeUndefined();
  });

  it('rejects a negative parallax at the schema', () => {
    expect(() => parallax(-3.2, 0.1)).toThrow();
  });
});
