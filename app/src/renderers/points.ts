// The nearby stellar scene: a point per star, sized by the legend's magnitude bands; a ring at the
// star's distance range where it spans a pixel; a tick for the height above the ecliptic the
// projection flattens (a graphical annotation, never a physical line); the focus and selection marks.
import { drawLabel, drawMarkDecorations } from './orbit-geometry';
import type { Renderer } from './renderer';
import type { ResolvedMark, Scene } from './representation-types';

/** A range ring is drawn only when the range spans this many pixels; below it would be the point itself. */
export const RANGE_RING_MIN_PX = 0.5;

const stellar = (r: Renderer, m: ResolvedMark) => {
  const tick = m.heightTickPx ?? 0;
  if (Math.abs(tick) >= 1) {
    r.polyline([m.at, { x: m.at.x, y: m.at.y - tick }], { vocabulary: 'graphical', stroke: 'muted', width: 0.75, alpha: 0.2 * m.alpha });
    r.polyline([{ x: m.at.x - 2, y: m.at.y - tick }, { x: m.at.x + 2, y: m.at.y - tick }], { vocabulary: 'graphical', stroke: 'muted', width: 0.75, alpha: 0.2 * m.alpha });
  }
  r.disc(m.at, m.radiusPx, { fill: 'ink', alpha: m.alpha });
  const span = m.rangePx ? m.rangePx.inner + m.rangePx.outer : 0;
  if (m.rangePx && span >= RANGE_RING_MIN_PX) {
    r.ring(m.at, m.radiusPx + m.rangePx.outer, { stroke: 'ink', lineWidth: 0.75, alpha: 0.5 * m.alpha, dash: [2, 2] });
  }
  drawMarkDecorations(r, m);
  drawLabel(r, m);
};

export const drawPoints = (r: Renderer, scene: Scene) => {
  for (const m of scene.marks) if (m.visible && m.shape === 'stellar') stellar(r, m);
};
