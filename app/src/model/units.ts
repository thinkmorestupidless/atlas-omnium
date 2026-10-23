// Quantities carry their unit as a type. Conversions are named functions, each tested against a
// reference value (tests/scientific/units.test.ts); nothing outside model/ multiplies by a constant.

export const UNITS = [
  'm', 'km', 'au', 'pc', 'kg', 's', 'd', 'mas', 'mas/yr', 'km/s', 'deg', 'mag', 'angstrom', 'g/mol', 'dimensionless',
] as const;
export type Unit = (typeof UNITS)[number];
export type LengthUnit = 'm' | 'km' | 'au' | 'pc' | 'angstrom';

export interface Quantity<U extends Unit = Unit> { readonly value: number; readonly unit: U }

export const quantity = <U extends Unit>(value: number, unit: U): Quantity<U> => {
  if (!Number.isFinite(value)) throw new Error(`a quantity must be finite, got ${value} ${unit}`);
  return { value, unit };
};

/** The astronomical unit in kilometres, exact by IAU 2012 Resolution B2. */
export const AU_KM = 149597870.7;
/** The parsec in metres: 648000/π au, by IAU 2015 Resolution B2. */
export const PC_M = (648000 / Math.PI) * AU_KM * 1000;

export const kmToAu = (q: Quantity<'km'>): Quantity<'au'> => quantity(q.value / AU_KM, 'au');
export const auToKm = (q: Quantity<'au'>): Quantity<'km'> => quantity(q.value * AU_KM, 'km');
export const kmToM = (q: Quantity<'km'>): Quantity<'m'> => quantity(q.value * 1000, 'm');
export const mToKm = (q: Quantity<'m'>): Quantity<'km'> => quantity(q.value / 1000, 'km');
export const auToM = (q: Quantity<'au'>): Quantity<'m'> => quantity(q.value * AU_KM * 1000, 'm');
export const pcToM = (q: Quantity<'pc'>): Quantity<'m'> => quantity(q.value * PC_M, 'm');
export const mToPc = (q: Quantity<'m'>): Quantity<'pc'> => quantity(q.value / PC_M, 'pc');
export const angstromToM = (q: Quantity<'angstrom'>): Quantity<'m'> => quantity(q.value * 1e-10, 'm');

/** Inverse parallax: the distance a parallax implies, without uncertainty (see parallax.ts for it). */
export const masToPc = (q: Quantity<'mas'>): Quantity<'pc'> => {
  if (q.value <= 0) throw new Error(`a parallax must be positive to give a distance, got ${q.value} mas`);
  return quantity(1000 / q.value, 'pc');
};

/** Any length to metres, by its unit. */
export const lengthToM = (q: Quantity<LengthUnit>): Quantity<'m'> => {
  switch (q.unit) {
    case 'm': return q as Quantity<'m'>;
    case 'km': return kmToM(q as Quantity<'km'>);
    case 'au': return auToM(q as Quantity<'au'>);
    case 'pc': return pcToM(q as Quantity<'pc'>);
    case 'angstrom': return angstromToM(q as Quantity<'angstrom'>);
  }
};

/** A length scale factor to metres, for vectors carried with a unit. */
export const metresPer = (unit: LengthUnit): number => lengthToM(quantity(1, unit)).value;

/** The unit a person reads a distance in, chosen by size: km below 0.01 au, au below 0.1 pc, pc above. */
export const readableDistance = (m: Quantity<'m'>): Quantity<'km' | 'au' | 'pc'> => {
  const au = m.value / (AU_KM * 1000);
  if (au < 0.01) return mToKm(m);
  if (m.value / PC_M < 0.1) return quantity(au, 'au');
  return mToPc(m);
};
