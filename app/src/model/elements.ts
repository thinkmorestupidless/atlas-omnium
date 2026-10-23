// Orbit tracks from Keplerian elements: a closed polyline in the heliocentric ecliptic, sampled
// uniformly in eccentric anomaly (denser where the orbit turns fastest). A track is a derived state
// for drawing only; positions come from the ephemerides (decision 0004).
import type { DerivedState } from './derived';
import type { Frame, Vector3 } from './frames';
import type { AtlasId } from './ids';
import type { Elements } from './schema';

export const KEPLERIAN = { name: 'keplerian-elements', version: '1' } as const;

export interface Track {
  readonly points: readonly Vector3[];
  readonly unit: 'au';
  readonly frame: Frame;
  readonly validity: { readonly from: string; readonly to: string };
  readonly description: string;
}

const RAD = Math.PI / 180;

export const trackPoints = (el: Pick<Elements, 'a' | 'e' | 'i' | 'node' | 'argPeri'>, n = 256 + Math.round(el.e * 768)): Vector3[] => {
  const a = el.a.value;
  const e = el.e;
  const b = a * Math.sqrt(1 - e * e);
  const [ci, si] = [Math.cos(el.i * RAD), Math.sin(el.i * RAD)];
  const [cO, sO] = [Math.cos(el.node * RAD), Math.sin(el.node * RAD)];
  const [cw, sw] = [Math.cos(el.argPeri * RAD), Math.sin(el.argPeri * RAD)];
  const out: Vector3[] = [];
  for (let k = 0; k < n; k++) {
    const E = (2 * Math.PI * k) / n;
    const xp = a * (Math.cos(E) - e);
    const yp = b * Math.sin(E);
    // Rotate by the argument of perihelion, the inclination and the node.
    const x1 = cw * xp - sw * yp;
    const y1 = sw * xp + cw * yp;
    out.push([cO * x1 - sO * ci * y1, sO * x1 + cO * ci * y1, si * y1]);
  }
  return out;
};

export const orbitTrack = (el: Elements): DerivedState<Track> => {
  if (el.a.unit !== 'au') throw new Error(`elements of ${el.subject} are in ${el.a.unit}, not au`);
  return {
    subject: el.subject as AtlasId,
    property: 'orbitTrack',
    value: { points: trackPoints(el), unit: 'au', frame: el.frame as Frame, validity: el.validity, description: el.model },
    status: 'derived',
    model: KEPLERIAN,
    from: [`${el.source.dataset}: ${el.source.record}`],
  };
};
