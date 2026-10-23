import { describe, expect, it } from 'vitest';
import reference from '../fixtures/iers-reference.json';
import { epochToIsoUtc, jdFromIsoUtc, taiMinusUtc, TDB_MINUS_TT_NEGLECTED_MAX_S, utcToTdb } from '../../app/src/model/time';

describe('time', () => {
  it('converts a civil instant to a Julian date in UTC', () => {
    expect(jdFromIsoUtc('2000-01-01T12:00:00Z')).toEqual({ scale: 'UTC', jd: 2451545.0 });
    expect(jdFromIsoUtc('2026-10-22T00:00:00Z').jd).toBe(2461335.5);
  });

  it('puts J2000.0 at JD 2451545.0 in TT from its defining UTC instant', () => {
    const tdb = utcToTdb(jdFromIsoUtc(reference.j2000.utc));
    expect(tdb.scale).toBe('TDB');
    // TDB is TT here; the neglected difference is under 2 ms (2.3e-8 d).
    expect(Math.abs(tdb.jd - reference.j2000.jdTt)).toBeLessThan(1e-9);
  });

  it('uses the leap seconds in force on each date', () => {
    for (const row of reference.taiMinusUtc) {
      expect(taiMinusUtc(jdFromIsoUtc(`${row.from}T00:00:00Z`))).toBe(row.seconds);
    }
    expect(taiMinusUtc(jdFromIsoUtc('2008-12-31T23:59:59Z'))).toBe(33);
    const before = utcToTdb(jdFromIsoUtc('2016-06-01T00:00:00Z')).jd - jdFromIsoUtc('2016-06-01T00:00:00Z').jd;
    const after = utcToTdb(jdFromIsoUtc('2018-06-01T00:00:00Z')).jd - jdFromIsoUtc('2018-06-01T00:00:00Z').jd;
    expect((after - before) * 86400).toBeCloseTo(1, 3); // a JD near 2.4e6 resolves about 40 µs
  });

  it('refuses a date before its leap-second table rather than guessing', () => {
    expect(() => taiMinusUtc(jdFromIsoUtc('1990-01-01T00:00:00Z'))).toThrow(/leap-second table/);
  });

  it('states the neglected TDB minus TT difference', () => {
    expect(TDB_MINUS_TT_NEGLECTED_MAX_S).toBeLessThan(0.002);
  });

  it('returns a TDB epoch to the civil date it came from', () => {
    const utc = '2030-01-01T00:00:00.000Z';
    expect(epochToIsoUtc(utcToTdb(jdFromIsoUtc(utc)))).toBe(utc);
  });

  it('refuses to convert an epoch that is not in UTC', () => {
    expect(() => utcToTdb({ scale: 'TT', jd: 2451545 })).toThrow();
  });
});
