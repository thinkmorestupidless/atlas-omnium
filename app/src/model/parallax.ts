// A star's distance and position, derived from its catalogue observations. The distance is the
// inverse of the parallax ("inverse-parallax"); its uncertainty is the range the parallax's ±1σ
// gives, which is not symmetric, so it is an interval and never a σ. A missing parallax gives a
// missing distance. Positions are at the catalogue's epoch: 001 applies no proper motion.
import type { DerivedState } from './derived';
import { ECLIPTIC_J2000, icrsToEcliptic, raDecToUnitVector, type PositionAtEpoch, type Vector3 } from './frames';
import type { AtlasId } from './ids';
import type { Observations } from './observations';
import type { Observation } from './schema';
import { quantity, type Quantity } from './units';

export const INVERSE_PARALLAX = { name: 'inverse-parallax', version: '1' } as const;
export const ASTROMETRY_TO_POSITION = { name: 'gaia-astrometry-to-position', version: '1' } as const;
const DEG = Math.PI / 180;

export const distanceFromParallax = (parallax: Observation): DerivedState<Quantity<'pc'> | null> => {
  if (parallax.property !== 'parallax' || parallax.unit !== 'mas') throw new Error(`inverse parallax takes a parallax in mas, got ${parallax.property} in ${parallax.unit}`);
  const base = { subject: parallax.subject as AtlasId, property: 'distance' as const, status: 'derived' as const, model: INVERSE_PARALLAX, from: [parallax.id] };
  const p = parallax.value;
  if (p === null) return { ...base, value: null };
  if (!(p > 0)) throw new Error(`a parallax must be positive to give a distance, got ${p} mas`);
  const value = quantity(1000 / p, 'pc');
  const u = parallax.uncertainty;
  if (!u) return { ...base, value };
  const sigma = u.kind === 'stddev' ? u.sigma : null;
  if (sigma === null) throw new Error('a parallax uncertainty is a σ from the catalogue');
  // A parallax within 1σ of zero leaves the far end unbounded; the sample's cut excludes that.
  if (!(p - sigma > 0)) throw new Error(`the parallax ${p} ± ${sigma} mas does not bound a distance`);
  return { ...base, value, uncertainty: { kind: 'interval', low: 1000 / (p + sigma), high: 1000 / (p - sigma) } };
};

/** ICRS Cartesian in pc, the Sun at the origin, from right ascension and declination in degrees and a distance. */
export const icrsCartesian = (raDeg: number, decDeg: number, distancePc: number): Vector3 => {
  const u = raDecToUnitVector(raDeg * DEG, decDeg * DEG);
  return [u[0] * distancePc, u[1] * distancePc, u[2] * distancePc];
};

export interface StarState {
  readonly distance: DerivedState<Quantity<'pc'> | null>;
  /** Heliocentric ecliptic of J2000 in pc at the catalogue epoch; null when a needed observation is missing. */
  readonly position: DerivedState<PositionAtEpoch> | null;
}

export const starState = (observations: Observations, id: AtlasId): StarState | null => {
  const plx = observations.measured(id, 'parallax').observation;
  if (!plx) return null;
  const distance = distanceFromParallax(plx);
  const ra = observations.measured(id, 'ra').observation;
  const dec = observations.measured(id, 'dec').observation;
  if (distance.value === null || !ra || !dec || ra.value === null || dec.value === null || !plx.epoch) return { distance, position: null };
  const r = icrsToEcliptic(icrsCartesian(ra.value, dec.value, distance.value.value));
  return {
    distance,
    position: {
      subject: id, property: 'position', status: 'derived', model: ASTROMETRY_TO_POSITION, from: [plx.id, ra.id, dec.id],
      value: { r, unit: 'pc', frame: ECLIPTIC_J2000, epoch: plx.epoch },
      ...(distance.uncertainty ? { uncertainty: distance.uncertainty } : {}),
    },
  };
};

/** Every member of the release's star sample, with its distance and position, by atlas id. */
export const starStates = (model: { observations: Observations; stars: { sample: { members: readonly string[] } } | null }): Map<AtlasId, StarState> => {
  const out = new Map<AtlasId, StarState>();
  for (const id of model.stars?.sample.members ?? []) {
    const s = starState(model.observations, id as AtlasId);
    if (s) out.set(id as AtlasId, s);
  }
  return out;
};
