// The one projection from Earth orbit to the stars (research R10): the ecliptic plane of J2000 seen
// from its north pole, x to the right and y up, the height above the plane flattened and declared.
import { toMetres, type PositionAtEpoch, type Vector3 } from '../model/frames';
import type { Projected, Projection, View } from './projection';

const ECLIPTIC_FRAMES = new Set(['heliocentric-ecliptic']);

export const eclipticTopDown: Projection = {
  name: 'ecliptic-top-down',
  flattens: { dimension: 'ecliptic-z', declared: true, words: 'seen from above the ecliptic: height above it is flattened' },
  project(p: PositionAtEpoch, view: View): Projected {
    if (!ECLIPTIC_FRAMES.has(p.frame.kind)) throw new Error(`the ecliptic projection takes heliocentric ecliptic positions, not ${p.frame.kind}`);
    return this.projectMetres(toMetres(p), view);
  },
  projectMetres(m: Vector3, view: View): Projected {
    return {
      x: view.width / 2 + (m[0] - view.centre[0] - view.pan.x) / view.scale,
      y: view.height / 2 - (m[1] - view.centre[1] - view.pan.y) / view.scale,
      height: m[2],
    };
  },
  offsetOf(s, view) {
    return { x: (s.x - view.width / 2) * view.scale, y: -(s.y - view.height / 2) * view.scale };
  },
};
