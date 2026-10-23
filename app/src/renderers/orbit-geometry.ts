// The planetary scene: orbit tracks as thin physical lines, discs and points for the bodies, the
// selection ring and the focus weight (never a status mark's shape, R11), and labels through the
// collision pass.
import type { Renderer } from './renderer';
import type { ResolvedMark, Scene } from './representation-types';

export const SELECTION_GAP_PX = 5;

export const drawMarkDecorations = (r: Renderer, m: ResolvedMark) => {
  if (m.focused) r.ring(m.at, m.radiusPx + 1.5, { stroke: 'ink', lineWidth: 2.5, alpha: m.alpha });
  if (m.selected) r.ring(m.at, m.radiusPx + SELECTION_GAP_PX, { stroke: 'cobalt', lineWidth: 1.5, alpha: Math.max(m.alpha, 0.6) });
};

export const drawLabel = (r: Renderer, m: ResolvedMark) => {
  if (!m.visible || !m.label) return;
  r.textAnchor({ x: m.at.x + m.radiusPx + SELECTION_GAP_PX + 4, y: m.at.y + 4 }, m.label, {
    face: 'mono', size: 12, colour: m.selected || m.focused ? 'ink' : 'muted', priority: m.labelPriority, alpha: Math.max(m.alpha, 0.4),
  });
};

export const drawOrbitGeometry = (r: Renderer, scene: Scene) => {
  for (const l of scene.lines) if (l.visible) r.polyline(l.points, l.style, l.closed);
  for (const m of scene.marks) {
    if (!m.visible || m.shape === 'stellar') continue;
    if (m.shape === 'point') r.disc(m.at, m.radiusPx, { fill: 'ink', alpha: m.alpha });
    else r.disc(m.at, m.radiusPx, { ...m.style, alpha: m.alpha });
    drawMarkDecorations(r, m);
    drawLabel(r, m);
  }
};
