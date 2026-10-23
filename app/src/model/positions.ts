// Every Solar System body's heliocentric position at an epoch, as derived states. The Sun is the
// origin of the heliocentric frame by definition; the Moon's geocentric state is added to Earth's at
// the same epoch.
import type { DerivedState, Model } from './derived';
import { positionAt } from './ephemeris';
import { ECLIPTIC_J2000, geocentricToHeliocentric, type PositionAtEpoch } from './frames';
import { IDS, type AtlasId } from './ids';
import { jdFromIsoUtc, utcToTdb, type Epoch } from './time';

export const epochOf = (utc: string): Epoch => utcToTdb(jdFromIsoUtc(utc));

export const sunAtOrigin = (epoch: Epoch): DerivedState<PositionAtEpoch> => ({
  subject: IDS.sun,
  property: 'position',
  value: { r: [0, 0, 0], unit: 'km', frame: ECLIPTIC_J2000, epoch },
  status: 'derived',
  model: { name: 'frame-origin', version: '1' },
  from: [],
});

export const bodyPositions = (model: Pick<Model, 'ephemerides' | 'precision'>, epoch: Epoch): Map<AtlasId, DerivedState<PositionAtEpoch>> => {
  const out = new Map<AtlasId, DerivedState<PositionAtEpoch>>();
  out.set(IDS.sun, sunAtOrigin(epoch));
  for (const [subject, f] of model.ephemerides) {
    if (f.frame.kind !== 'heliocentric-ecliptic') continue;
    out.set(subject as AtlasId, positionAt(f, epoch, model.precision.get(subject)));
  }
  const moon = model.ephemerides.get(IDS.moon);
  const earth = out.get(IDS.earth);
  if (moon && earth) {
    const geo = positionAt(moon, epoch, model.precision.get(IDS.moon));
    out.set(IDS.moon, { ...geo, value: geocentricToHeliocentric(geo.value, earth.value), from: [...geo.from, ...earth.from] });
  }
  return out;
};

/** The Moon's path about Earth over one sidereal month centred on the epoch, geocentric, in km. */
export const SIDEREAL_MONTH_DAYS = 27.321661;
export const moonLoop = (model: Pick<Model, 'ephemerides'>, epoch: Epoch, n = 180): [number, number, number][] => {
  const f = model.ephemerides.get(IDS.moon);
  if (!f) return [];
  const first = f.rows[0]?.[0] ?? 0;
  const last = f.rows[f.rows.length - 1]?.[0] ?? 0;
  const out: [number, number, number][] = [];
  for (let k = 0; k <= n; k++) {
    const jd = epoch.jd + SIDEREAL_MONTH_DAYS * (k / n - 0.5);
    if (jd < first || jd > last) continue;
    out.push(positionAt(f, { scale: 'TDB', jd }).value.r as [number, number, number]);
  }
  return out;
};
