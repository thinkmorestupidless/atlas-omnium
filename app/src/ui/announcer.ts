// The mode change, said twice: to a screen reader through a live region, and on screen as a notice,
// because a structural step is a different kind of step and must never pass for zooming (FR-015).
import type { NavigationState } from '../navigation/state';
import { h } from './dom';

/** How long the on-screen notice stays; the live region keeps its words until the next change. */
export const NOTICE_MS = 6000;

/** The body the structural branch leaves from and returns to: the last spatial stop on the breadcrumb. */
const spatialFocus = (s: NavigationState) => [...s.breadcrumb].reverse().find((c) => c.mode === 'spatial')?.id ?? s.focus;

export const announcementText = (modeChange: 'entered-structural' | 'left-structural', name: string) =>
  modeChange === 'entered-structural' ? `a different kind of step: what ${name} is made of` : `back to where ${name} is`;

export const announcer = () => {
  const live = h('div', { id: 'announcer', class: 'visually-hidden', role: 'status', 'aria-live': 'assertive' });
  const notice = h('p', { class: 'mode-notice' });
  notice.hidden = true;
  let seq = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    live, notice,
    update(s: NavigationState, nameOf: (id: NavigationState['focus']) => string) {
      const a = s.announcement;
      if (!a || a.seq === seq) return;
      seq = a.seq;
      const text = announcementText(a.modeChange, nameOf(spatialFocus(s)));
      live.textContent = text;
      notice.textContent = text;
      notice.hidden = false;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { notice.hidden = true; }, NOTICE_MS);
    },
  };
};
