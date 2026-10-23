// The keyboard reaches everything a pointer does (contracts/surface.md, docs/rendering.md).
//
//   + / -            scale in / out about the focus         Shift+↑ / Shift+↓  the same
//   Alt+arrows       pan                                     ← → ↑ ↓            move the selection among visible marks
//   Enter            focus the selection                     Backspace          go back along the breadcrumb
//   x                scale policy: true or exaggerated       t, Space           play or pause
//   [ / ]            slower / faster                         d                  the date field
//   /                search                                  i                  inspect the selection
//   l                the legend                              m                  what is it made of?
//   Escape           close the inspector, the legend or the search; leave a field
//   Tab              moves through the controls: lock-up, scale rail (and the made-of offer), time, breadcrumb,
//                    search, the selection's values and the inspector they open, the legend
//
// The canvas is role="img" with an aria-label naming the focus, the regime and the mode. A mode change
// is said in a live region as well as on screen. Nothing animates: each transition is drawn per frame
// from the scale, and under reduced motion (ui/motion.ts) the fades are cuts and the cue is still.
import type { Action } from './actions';

export const SCALE_STEP = 2;
export const PAN_STEP_PX = 80;

export interface KeyboardHooks {
  dateField(): void;
  rateStep(dir: 1 | -1): void;
  search?(): void;
  escape?(): void;
  inspectSelection?(): void;
}

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

export const bindingFor = (ev: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>): Action | null => {
  if (ev.ctrlKey || ev.metaKey) return null;
  const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const arrow = arrows[ev.key];
  if (arrow && ev.altKey) return { kind: 'pan', dxPx: -arrow[0] * PAN_STEP_PX, dyPx: -arrow[1] * PAN_STEP_PX };
  if (arrow && ev.shiftKey && arrow[1] !== 0) return { kind: 'scale', factor: arrow[1] < 0 ? SCALE_STEP : 1 / SCALE_STEP };
  if (arrow && !ev.shiftKey) return { kind: 'cycleSelection', direction: arrow[0] + arrow[1] > 0 ? 1 : -1 };
  switch (ev.key) {
    case '+': case '=': return { kind: 'scale', factor: 1 / SCALE_STEP };
    case '-': case '_': return { kind: 'scale', factor: SCALE_STEP };
    case 'Enter': return { kind: 'focus' };
    case 'Backspace': return { kind: 'back' };
    case 'x': return { kind: 'scalePolicy' };
    case 't': case ' ': return { kind: 'togglePlay' };
    case 'l': return { kind: 'legend' };
    case 'm': return { kind: 'enterStructural' };
    default: return null;
  }
};

export const attachKeyboard = (dispatch: (a: Action) => void, hooks: KeyboardHooks) => {
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { hooks.escape?.(); if (typing(ev.target)) (ev.target as HTMLElement).blur(); return; }
    if (typing(ev.target)) return;
    // A focused button keeps its own Enter and Space.
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target instanceof HTMLButtonElement) return;
    if (ev.key === 'd' && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); hooks.dateField(); return; }
    if (ev.key === '[' || ev.key === ']') { ev.preventDefault(); hooks.rateStep(ev.key === ']' ? 1 : -1); return; }
    if (ev.key === '/') { ev.preventDefault(); hooks.search?.(); return; }
    if (ev.key === 'i' && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); hooks.inspectSelection?.(); return; }
    const a = bindingFor(ev);
    if (!a) return;
    ev.preventDefault();
    dispatch(a);
  });
};
