// The time controller: the supported window, the date, play and pause, the rate, and the epoch of
// the displayed positions in its time scale, always visible. A date outside the window is refused
// inline and the date stays as it was (FR-005).
import type { Action } from '../input/actions';
import { epochOf } from '../model/positions';
import type { NavigationState } from '../navigation/state';
import { h } from './dom';

export const RATES = [1 / 24, 0.25, 1, 7, 30, 365] as const;

export const rateWords = (d: number): string => {
  if (d === 1) return 'one day per second';
  if (d < 1) return `${Math.round(d * 24)} hours per second`;
  return `${d} days per second`;
};

export const epochText = (utc: string): { civil: string; tdb: string } => {
  const e = epochOf(utc);
  const t = utc.slice(11, 19);
  return { civil: t === '00:00:00' ? utc.slice(0, 10) : `${utc.slice(0, 10)} ${t}`, tdb: `JD ${e.jd.toFixed(6)} TDB` };
};

export const timeController = (dispatch: (a: Action) => void) => {
  const windowText = h('p', { class: 'time-window', 'data-field': 'window' });
  const input = h('input', { type: 'text', id: 'date', name: 'date', inputmode: 'numeric', autocomplete: 'off', spellcheck: 'false', 'aria-keyshortcuts': 'd', 'aria-describedby': 'time-refusal' });
  const form = h('form', { class: 'time-date' }, h('label', { for: 'date' }, 'date'), input, h('button', { type: 'submit' }, 'go'));
  const playButton = h('button', { type: 'button', class: 'time-play', 'aria-keyshortcuts': 't Space', 'aria-pressed': 'false' }, 'play');
  const slower = h('button', { type: 'button', 'aria-label': 'slower', 'aria-keyshortcuts': '[' }, '[');
  const faster = h('button', { type: 'button', 'aria-label': 'faster', 'aria-keyshortcuts': ']' }, ']');
  const rate = h('span', { class: 'time-rate', 'data-field': 'rate' });
  const epoch = h('p', { class: 'time-epoch', 'data-field': 'epoch', 'aria-live': 'off' });
  const refusal = h('p', { class: 'time-refusal', id: 'time-refusal', role: 'alert', 'data-field': 'refusal' });
  const el = h('section', { class: 'time-controller mono', 'aria-label': 'time controller' },
    windowText, form, h('div', { class: 'time-play-row' }, playButton, slower, rate, faster), epoch, refusal);

  let current: NavigationState | null = null;
  form.addEventListener('submit', (ev) => { ev.preventDefault(); dispatch({ kind: 'setDate', date: input.value }); });
  playButton.addEventListener('click', () => dispatch({ kind: 'togglePlay' }));
  const step = (dir: 1 | -1) => {
    const d = current?.rate.daysPerSecond ?? 1;
    const i = RATES.findIndex((r) => r >= d);
    const next = RATES[Math.min(RATES.length - 1, Math.max(0, (i < 0 ? RATES.length - 1 : i) + dir))];
    if (next !== undefined) dispatch({ kind: 'setRate', daysPerSecond: next });
  };
  slower.addEventListener('click', () => step(-1));
  faster.addEventListener('click', () => step(1));

  return {
    el,
    input,
    step,
    update(s: NavigationState) {
      const prev = current;
      current = s;
      windowText.textContent = `supported window ${s.window.from} to ${s.window.to}`;
      windowText.dataset.from = s.window.from;
      windowText.dataset.to = s.window.to;
      if (document.activeElement !== input || prev?.utc !== s.utc) input.value = s.utc.slice(11, 19) === '00:00:00' ? s.utc.slice(0, 10) : s.utc.replace('.000Z', 'Z');
      playButton.textContent = s.playing ? 'pause' : 'play';
      playButton.setAttribute('aria-pressed', String(s.playing));
      rate.textContent = rateWords(s.rate.daysPerSecond);
      const t = epochText(s.utc);
      epoch.textContent = `positions at ${t.civil} UTC · ${t.tdb}`;
      epoch.dataset.civil = t.civil;
      epoch.dataset.scale = 'TDB';
      refusal.textContent = s.refusal ? `${s.refusal.date} is outside the supported window, ${s.refusal.window.from} to ${s.refusal.window.to}; the date is unchanged` : '';
      refusal.hidden = !s.refusal;
    },
  };
};
