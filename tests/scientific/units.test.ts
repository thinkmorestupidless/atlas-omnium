import { describe, expect, it } from 'vitest';
import { AU_KM, PC_M, auToM, kmToAu, masToPc, mToPc, pcToM, quantity } from '../../app/src/model/units';
import { QuantitySchema, UnitSchema, ObservationSchema } from '../../app/src/model/schema';

describe('units', () => {
  it('uses the IAU 2012 astronomical unit and the IAU 2015 parsec', () => {
    expect(AU_KM).toBe(149597870.7);
    expect(PC_M).toBeCloseTo(3.085677581491367e16, 0);
    expect(PC_M / (AU_KM * 1000)).toBeCloseTo(648000 / Math.PI, 6);
  });

  it('converts km to au and back without loss', () => {
    const a = kmToAu(quantity(AU_KM * 5.2, 'km'));
    expect(a.unit).toBe('au');
    expect(a.value).toBeCloseTo(5.2, 12);
    expect(auToM(a).value).toBeCloseTo(AU_KM * 5.2 * 1000, 0);
  });

  it('converts parsecs to metres and back', () => {
    const d = pcToM(quantity(1.3, 'pc'));
    expect(d.unit).toBe('m');
    expect(mToPc(d).value).toBeCloseTo(1.3, 12);
  });

  it('turns a parallax in milliarcseconds into a distance in parsecs', () => {
    expect(masToPc(quantity(1000, 'mas'))).toEqual({ value: 1, unit: 'pc' });
    expect(masToPc(quantity(100, 'mas')).value).toBeCloseTo(10, 12);
  });

  it('rejects an unknown unit', () => {
    expect(UnitSchema.safeParse('furlong').success).toBe(false);
    expect(QuantitySchema.safeParse({ value: 1, unit: 'leagues' }).success).toBe(false);
  });

  it('rejects a negative parallax rather than clamping it', () => {
    const parallax = {
      id: 'obs:gaia:1:parallax', subject: 'atlas:gaia-dr3-1', property: 'parallax', value: -3, unit: 'mas',
      source: { dataset: 'gaia', release: 'DR3', record: '1', retrieved: '2026-10-23T00:00:00Z' },
      epoch: { scale: 'TDB', jd: 2457389.0 },
    };
    expect(ObservationSchema.safeParse(parallax).success).toBe(false);
    expect(ObservationSchema.safeParse({ ...parallax, value: 768.07 }).success).toBe(true);
  });
});
