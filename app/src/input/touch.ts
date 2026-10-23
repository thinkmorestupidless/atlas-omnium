// Touch: pinch scales about the pinch's centre, one finger drags to pan, a tap selects and a second
// tap on the same mark focuses it.
import type { AtlasId } from '../model/ids';
import type { Scene } from '../renderers/representation-types';
import type { Action } from './actions';
import { hitTest } from './hit';

const TAP_PX = 10;

export const attachTouch = (canvas: HTMLCanvasElement, dispatch: (a: Action) => void, scene: () => Scene | null, selection: () => AtlasId | null) => {
  const points = new Map<number, { x: number; y: number }>();
  let start: { x: number; y: number } | null = null;
  let moved = false;
  const local = (ev: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  const spread = () => { const [a, b] = [...points.values()]; return a && b ? { d: Math.hypot(a.x - b.x, a.y - b.y), c: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } } : null; };

  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType !== 'touch') return;
    points.set(ev.pointerId, local(ev));
    canvas.setPointerCapture(ev.pointerId);
    if (points.size === 1) { start = local(ev); moved = false; }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'touch' || !points.has(ev.pointerId)) return;
    const before = spread();
    const prev = points.get(ev.pointerId) as { x: number; y: number };
    const p = local(ev);
    points.set(ev.pointerId, p);
    if (points.size >= 2) {
      const after = spread();
      if (before && after && after.d > 0) dispatch({ kind: 'scale', factor: before.d / after.d, anchorPx: after.c });
      moved = true;
      return;
    }
    if (start && Math.hypot(p.x - start.x, p.y - start.y) > TAP_PX) moved = true;
    if (moved) dispatch({ kind: 'pan', dxPx: p.x - prev.x, dyPx: p.y - prev.y });
  });
  const end = (ev: PointerEvent) => {
    if (ev.pointerType !== 'touch') return;
    const single = points.size === 1;
    points.delete(ev.pointerId);
    if (!single || moved) return;
    const p = local(ev);
    const id = hitTest(scene(), p.x, p.y);
    if (!id) return;
    if (id === selection()) dispatch({ kind: 'focus' });
    else dispatch({ kind: 'select', id });
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', (ev) => points.delete(ev.pointerId));
};
