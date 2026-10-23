// Mouse and trackpad: the wheel scales about the pointer, a drag pans, a click selects, a double
// click focuses. Touch is touch.ts's.
import type { Scene } from '../renderers/representation-types';
import type { Action } from './actions';
import { hitTest } from './hit';

export const WHEEL_RATE = 0.0015;
const DRAG_THRESHOLD_PX = 4;

export const attachPointer = (canvas: HTMLCanvasElement, dispatch: (a: Action) => void, scene: () => Scene | null) => {
  const local = (ev: MouseEvent) => { const r = canvas.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
    dispatch({ kind: 'scale', factor: Math.exp(dy * WHEEL_RATE), anchorPx: local(ev) });
  }, { passive: false });

  let down: { x: number; y: number; moved: boolean } | null = null;
  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'touch' || ev.button !== 0) return;
    down = { ...local(ev), moved: false };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!down || ev.pointerType === 'touch') return;
    const p = local(ev);
    const dx = p.x - down.x;
    const dy = p.y - down.y;
    if (!down.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    down = { ...p, moved: true };
    dispatch({ kind: 'pan', dxPx: dx, dyPx: dy });
  });
  canvas.addEventListener('pointerup', (ev) => {
    if (ev.pointerType === 'touch' || !down) return;
    const wasDrag = down.moved;
    down = null;
    if (wasDrag) return;
    const p = local(ev);
    const id = hitTest(scene(), p.x, p.y);
    if (id) dispatch({ kind: 'select', id });
  });
  canvas.addEventListener('dblclick', (ev) => {
    const p = local(ev);
    const id = hitTest(scene(), p.x, p.y);
    if (id) { dispatch({ kind: 'select', id }); dispatch({ kind: 'focus' }); }
  });
};
