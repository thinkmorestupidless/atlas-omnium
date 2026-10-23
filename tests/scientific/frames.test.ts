import { describe, expect, it } from 'vitest';
import {
  ECLIPTIC_J2000, GEOCENTRIC_ECLIPTIC_J2000, HORIZONS_OBLIQUITY_ARCSEC, geocentricToHeliocentric, icrsToEcliptic,
  raDecToUnitVector,
} from '../../app/src/model/frames';
import { FrameSchema } from '../../app/src/model/schema';

const deg = Math.PI / 180;

describe('frames', () => {
  it('uses the obliquity Horizons uses for its ecliptic of J2000', () => {
    expect(HORIZONS_OBLIQUITY_ARCSEC).toBe(84381.448);
  });

  it('takes the north ecliptic pole to the ecliptic z axis', () => {
    const eps = HORIZONS_OBLIQUITY_ARCSEC / 3600;
    const pole = icrsToEcliptic(raDecToUnitVector(270 * deg, (90 - eps) * deg));
    expect(pole[0]).toBeCloseTo(0, 8);
    expect(pole[1]).toBeCloseTo(0, 8);
    expect(pole[2]).toBeCloseTo(1, 8);
  });

  it('leaves the vernal equinox where it is', () => {
    const x = icrsToEcliptic([1, 0, 0]);
    expect(x).toEqual([1, 0, 0]);
  });

  it('rejects an unknown frame', () => {
    expect(FrameSchema.safeParse({ kind: 'galactic' }).success).toBe(false);
    expect(FrameSchema.safeParse(ECLIPTIC_J2000).success).toBe(true);
  });

  it("adds Earth's state to a geocentric position at the same epoch", () => {
    const epoch = { scale: 'TDB' as const, jd: 2451545 };
    const moon = { r: [384400, 0, 0] as const, unit: 'km' as const, frame: GEOCENTRIC_ECLIPTIC_J2000, epoch };
    const earth = { r: [1.5e8, 0, 0] as const, unit: 'km' as const, frame: ECLIPTIC_J2000, epoch };
    const helio = geocentricToHeliocentric(moon, earth);
    expect(helio.r).toEqual([1.5e8 + 384400, 0, 0]);
    expect(helio.frame).toEqual(ECLIPTIC_J2000);
  });

  it('refuses to add states at different epochs or in the wrong frames', () => {
    const moon = { r: [1, 0, 0] as const, unit: 'km' as const, frame: GEOCENTRIC_ECLIPTIC_J2000, epoch: { scale: 'TDB' as const, jd: 1 } };
    const earth = { r: [1, 0, 0] as const, unit: 'km' as const, frame: ECLIPTIC_J2000, epoch: { scale: 'TDB' as const, jd: 2 } };
    expect(() => geocentricToHeliocentric(moon, earth)).toThrow(/epoch/);
    expect(() => geocentricToHeliocentric({ ...moon, frame: ECLIPTIC_J2000, epoch: earth.epoch }, earth)).toThrow(/frame/);
  });
});
