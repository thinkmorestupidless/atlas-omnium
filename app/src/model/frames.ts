// Reference frames are types. A position is a vector in a named frame, in a named unit, at an epoch,
// or it does not exist.
import type { Epoch } from './time';
import type { LengthUnit } from './units';
import { metresPer } from './units';

export type Vector3 = readonly [number, number, number];

export type Frame =
  | { readonly kind: 'heliocentric-ecliptic'; readonly equinox: 'J2000'; readonly system: 'ICRF' }
  | { readonly kind: 'geocentric-ecliptic'; readonly equinox: 'J2000'; readonly system: 'ICRF' }
  | { readonly kind: 'icrs-cartesian'; readonly origin: 'sun' }
  | { readonly kind: 'molecular-conformer'; readonly source: { dataset: string; release: string; record: string; retrieved: string } };

export const ECLIPTIC_J2000 = { kind: 'heliocentric-ecliptic', equinox: 'J2000', system: 'ICRF' } as const satisfies Frame;
export const GEOCENTRIC_ECLIPTIC_J2000 = { kind: 'geocentric-ecliptic', equinox: 'J2000', system: 'ICRF' } as const satisfies Frame;
export const ICRS_SUN = { kind: 'icrs-cartesian', origin: 'sun' } as const satisfies Frame;

export interface PositionAtEpoch {
  readonly r: Vector3;
  readonly unit: LengthUnit;
  readonly frame: Frame;
  readonly epoch: Epoch;
}

/**
 * The obliquity Horizons uses for its "Ecliptic of J2000.0" (IAU 1976, 84381.448″, stated in every
 * Horizons vectors response). The stars are rotated with the same value so the neighbourhood and
 * the Solar System share one plane exactly.
 */
export const HORIZONS_OBLIQUITY_ARCSEC = 84381.448;
const EPS = (HORIZONS_OBLIQUITY_ARCSEC / 3600) * (Math.PI / 180);
const COS_E = Math.cos(EPS);
const SIN_E = Math.sin(EPS);

/** Equatorial (ICRS) to ecliptic of J2000: a rotation about x by the obliquity. */
export const icrsToEcliptic = (v: Vector3): Vector3 => [v[0], v[1] * COS_E + v[2] * SIN_E, -v[1] * SIN_E + v[2] * COS_E];

export const raDecToUnitVector = (raRad: number, decRad: number): Vector3 => [
  Math.cos(decRad) * Math.cos(raRad),
  Math.cos(decRad) * Math.sin(raRad),
  Math.sin(decRad),
];

const sameEpoch = (a: Epoch, b: Epoch) => a.scale === b.scale && Math.abs(a.jd - b.jd) < 1e-9;

/** The Moon's heliocentric position: its geocentric position plus Earth's heliocentric one, at one epoch. */
export const geocentricToHeliocentric = (geo: PositionAtEpoch, earth: PositionAtEpoch): PositionAtEpoch => {
  if (!sameEpoch(geo.epoch, earth.epoch)) throw new Error('geocentricToHeliocentric needs both states at the same epoch');
  if (geo.frame.kind !== 'geocentric-ecliptic' || earth.frame.kind !== 'heliocentric-ecliptic') {
    throw new Error(`geocentricToHeliocentric needs a geocentric and a heliocentric frame, got ${geo.frame.kind} and ${earth.frame.kind}`);
  }
  const k = metresPer(geo.unit) / metresPer(earth.unit);
  return {
    r: [earth.r[0] + geo.r[0] * k, earth.r[1] + geo.r[1] * k, earth.r[2] + geo.r[2] * k],
    unit: earth.unit,
    frame: ECLIPTIC_J2000,
    epoch: earth.epoch,
  };
};

export const toMetres = (p: PositionAtEpoch): Vector3 => {
  const k = metresPer(p.unit);
  return [p.r[0] * k, p.r[1] * k, p.r[2] * k];
};

export const norm = (v: Vector3): number => Math.hypot(v[0], v[1], v[2]);
export const sub = (a: Vector3, b: Vector3): Vector3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
