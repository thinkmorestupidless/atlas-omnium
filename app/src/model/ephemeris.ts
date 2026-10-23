// Positions from sampled state vectors: binary search for the bracketing samples, then cubic Hermite
// with the velocities Horizons gives (decision 0004, research R1). The result is a derived state
// naming the two samples, the model and the release's measured precision for the body.
import type { DerivedState } from './derived';
import type { PositionAtEpoch } from './frames';
import type { AtlasId } from './ids';
import type { EphemerisFile, Precision } from './schema';
import type { Epoch } from './time';
import { quantity, type Quantity, type Unit } from './units';

export const HERMITE = { name: 'hermite-state-vectors', version: '1' } as const;
const SECONDS_PER_DAY = 86400;

export class OutsideWindow extends Error {
  constructor(readonly subject: string, readonly jd: number, readonly from: number, readonly to: number) {
    super(`${subject} has no samples at JD ${jd} TDB; its samples cover JD ${from} to ${to}`);
  }
}

/** The index i with rows[i][0] <= jd <= rows[i+1][0]. */
const bracket = (rows: EphemerisFile['rows'], jd: number): number => {
  let lo = 0;
  let hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((rows[mid]?.[0] ?? 0) <= jd) lo = mid; else hi = mid;
  }
  return lo;
};

export const hermite = (f: EphemerisFile, jd: number): [number, number, number] => {
  const first = f.rows[0]?.[0] ?? NaN;
  const last = f.rows[f.rows.length - 1]?.[0] ?? NaN;
  if (!(jd >= first && jd <= last)) throw new OutsideWindow(f.subject, jd, first, last);
  const i = bracket(f.rows, jd);
  const a = f.rows[i] as EphemerisFile['rows'][number];
  const b = (f.rows[i + 1] ?? a) as EphemerisFile['rows'][number];
  if (jd === a[0]) return [a[1], a[2], a[3]];
  if (jd === b[0]) return [b[1], b[2], b[3]];
  const span = b[0] - a[0];
  const s = (jd - a[0]) / span;
  const h = span * SECONDS_PER_DAY;
  const s2 = s * s;
  const s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;
  return [1, 2, 3].map((k) => h00 * (a[k] as number) + h10 * h * (a[k + 3] as number) + h01 * (b[k] as number) + h11 * h * (b[k + 3] as number)) as [number, number, number];
};

export const positionAt = (f: EphemerisFile, epoch: Epoch, precision?: Precision): DerivedState<PositionAtEpoch> => {
  if (epoch.scale !== 'TDB') throw new Error(`ephemerides are in TDB, not ${epoch.scale}`);
  const r = hermite(f, epoch.jd);
  const i = bracket(f.rows, epoch.jd);
  const from = [`${f.subject}@${f.rows[i]?.[0]}`, `${f.subject}@${f.rows[Math.min(i + 1, f.rows.length - 1)]?.[0]}`];
  return {
    subject: f.subject as AtlasId,
    property: 'position',
    value: { r, unit: 'km', frame: f.frame, epoch },
    status: 'derived',
    model: HERMITE,
    from,
    ...(precision ? { precision: quantity(precision.maxError.value, precision.maxError.unit) as Quantity<Unit> } : {}),
  };
};
