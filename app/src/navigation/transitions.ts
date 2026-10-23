// The transitions: each a pure function from state to state. A transition that does not apply
// returns the very same state object, so callers can tell nothing happened.
import type { AtlasId } from '../model/ids';
import { minimumScale } from './minimum-scale';
import { regimeFor } from './resolver';
import {
  HELIOCENTRIC_SCALE, STELLAR_SCALE, type Crumb, type Mode, type NavContext, type NavigationState, type ScalePolicy,
} from './state';

const DAY_MS = 86_400_000;
let announcementSeq = 0;
const announce = (modeChange: 'entered-structural' | 'left-structural') => ({ modeChange, seq: ++announcementSeq });

const quiet = (s: NavigationState): NavigationState =>
  s.announcement || s.candidates ? { ...s, announcement: null, candidates: null } : s;

/** Scale by a factor about a point given as an offset in metres from the view centre (default: the focus). */
export const scaleBy = (s: NavigationState, factor: number, ctx: NavContext, anchor?: { x: number; y: number }): NavigationState => {
  if (s.mode !== 'spatial' || !(factor > 0) || factor === 1) return s;
  const min = minimumScale(ctx.radiusKm(s.focus), ctx.viewportShortSidePx);
  const wanted = s.scale * factor;
  const scale = Math.max(wanted, min);
  if (scale === s.scale && s.offer !== null) return s;
  const atMinimum = wanted <= min;
  const k = scale / s.scale;
  // The anchor stays where it is on screen; by default the focus does.
  const a = anchor ?? { x: -s.pan.x, y: -s.pan.y };
  const pan = anchor ? { x: s.pan.x + a.x * (1 - k), y: s.pan.y + a.y * (1 - k) } : { x: s.pan.x * k, y: s.pan.y * k };
  return {
    ...quiet(s),
    scale,
    pan,
    regime: regimeFor(s.regime, scale, s.mode),
    offer: atMinimum && ctx.madeOf(s.focus) ? 'made-of' : null,
  };
};

export const panBy = (s: NavigationState, dx: number, dy: number): NavigationState =>
  s.mode !== 'spatial' || (dx === 0 && dy === 0) ? s : { ...quiet(s), pan: { x: s.pan.x + dx, y: s.pan.y + dy } };

export const select = (s: NavigationState, id: AtlasId | null): NavigationState =>
  s.selection === id ? s : { ...quiet(s), selection: id };

/** The view a focus arrives at: its own regime, at a scale no finer than it can be viewed at. */
const arrival = (s: NavigationState, id: AtlasId, ctx: NavContext): Pick<NavigationState, 'mode' | 'regime' | 'scale'> => {
  const domain = ctx.domainOf(id);
  if (domain === 'structural') return { mode: 'structural', regime: 'molecular', scale: s.scale };
  const fromStructural = s.mode === 'structural';
  let scale = s.scale;
  if (domain === 'stellar' && (s.regime !== 'nearby-stellar' || fromStructural)) scale = STELLAR_SCALE;
  if (domain === 'solar-system' && (s.regime === 'nearby-stellar' || fromStructural)) scale = HELIOCENTRIC_SCALE;
  scale = Math.max(scale, minimumScale(ctx.radiusKm(id), ctx.viewportShortSidePx));
  const regime = regimeFor(fromStructural ? 'planetary' : s.regime, scale, 'spatial');
  return { mode: 'spatial', regime: domain === 'stellar' ? 'nearby-stellar' : regime, scale };
};

const leaving = (s: NavigationState): Crumb[] => {
  const crumbs = [...s.breadcrumb];
  const last = crumbs[crumbs.length - 1];
  if (last && last.mode === s.mode) crumbs[crumbs.length - 1] = { ...last, regime: s.regime, scale: s.scale, pan: s.pan };
  return crumbs;
};

export const focusOn = (s: NavigationState, id: AtlasId, ctx: NavContext): NavigationState => {
  if (id === s.focus && s.mode === (ctx.domainOf(id) === 'structural' ? 'structural' : s.mode)) return s;
  const to = arrival(s, id, ctx);
  const crumbs = leaving(s);
  crumbs.push({ id, mode: to.mode, regime: to.regime, scale: to.scale, pan: { x: 0, y: 0 } });
  const modeChanged = to.mode !== s.mode;
  return {
    ...quiet(s),
    ...to,
    focus: id,
    selection: id,
    breadcrumb: crumbs,
    pan: { x: 0, y: 0 },
    offer: null,
    announcement: modeChanged ? announce(to.mode === 'structural' ? 'entered-structural' : 'left-structural') : null,
  };
};

/** Focus the selection. */
export const focus = (s: NavigationState, ctx: NavContext): NavigationState =>
  s.selection === null ? s : focusOn(s, s.selection, ctx);

export const back = (s: NavigationState, _ctx: NavContext): NavigationState => {
  const last = s.breadcrumb[s.breadcrumb.length - 1];
  if (!last) return s;
  // Leaving the structural branch before anything in it was focused: the same focus, back in its own mode.
  if (last.mode !== s.mode) {
    return { ...quiet(s), mode: last.mode, regime: last.regime, scale: last.scale, pan: last.pan, offer: null, announcement: announce('left-structural') };
  }
  if (s.breadcrumb.length < 2) return s;
  const crumbs = s.breadcrumb.slice(0, -1);
  const to = crumbs[crumbs.length - 1] as Crumb;
  const modeChanged: Mode | null = to.mode !== s.mode ? to.mode : null;
  return {
    ...quiet(s),
    focus: to.id,
    selection: to.id,
    breadcrumb: crumbs,
    mode: to.mode,
    regime: to.regime,
    scale: to.scale,
    pan: to.pan,
    offer: null,
    announcement: modeChanged ? announce(modeChanged === 'structural' ? 'entered-structural' : 'left-structural') : null,
  };
};

/** Go back to a given stop on the breadcrumb, as the breadcrumb's own buttons do. */
export const backTo = (s: NavigationState, index: number, ctx: NavContext): NavigationState => {
  let t = s;
  while (t.breadcrumb.length - 1 > index) { const n = back(t, ctx); if (n === t) break; t = n; }
  return t;
};

/** The explicit choice "what is it made of?": the only way into structural navigation (FR-015). */
export const enterStructural = (s: NavigationState, ctx: NavContext): NavigationState => {
  if (s.mode === 'structural' || !ctx.madeOf(s.focus)) return s;
  return { ...quiet(s), mode: 'structural', regime: 'molecular', offer: null, announcement: announce('entered-structural') };
};

const inWindow = (date: string, w: NavigationState['window']) => date >= w.from && date <= w.to;

export const setDate = (s: NavigationState, date: string): NavigationState => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return { ...s, refusal: { date, window: s.window } };
  if (!inWindow(date, s.window)) return { ...s, refusal: { date, window: s.window } };
  return { ...s, utc: `${date}T00:00:00.000Z`, refusal: null };
};

export const play = (s: NavigationState): NavigationState => (s.playing ? s : { ...s, playing: true, refusal: null });
export const pause = (s: NavigationState): NavigationState => (s.playing ? { ...s, playing: false } : s);
export const setRate = (s: NavigationState, daysPerSecond: number): NavigationState =>
  daysPerSecond === s.rate.daysPerSecond || !Number.isFinite(daysPerSecond) ? s : { ...s, rate: { daysPerSecond } };

/** Advance the date by the elapsed seconds at the rate, stopping at the window's end. */
export const tick = (s: NavigationState, elapsedSeconds: number): NavigationState => {
  if (!s.playing || elapsedSeconds <= 0) return s;
  const next = Date.parse(s.utc) + elapsedSeconds * s.rate.daysPerSecond * DAY_MS;
  const end = Date.parse(`${s.window.to}T00:00:00Z`);
  const start = Date.parse(`${s.window.from}T00:00:00Z`);
  if (next > end || next < start) {
    const edge = next > end ? end : start;
    return { ...s, utc: new Date(edge).toISOString(), playing: false, refusal: { date: new Date(next).toISOString().slice(0, 10), window: s.window } };
  }
  return { ...s, utc: new Date(next).toISOString() };
};

export const setScalePolicy = (s: NavigationState, scalePolicy: ScalePolicy): NavigationState =>
  s.scalePolicy === scalePolicy ? s : { ...s, scalePolicy };

/** Search: one match is a focus; several are offered with their kinds and nothing else changes. */
export const search = (s: NavigationState, query: string, ctx: NavContext): NavigationState => {
  const q = query.trim();
  if (!q) return s;
  const found = ctx.search(q);
  const exact = found.filter((c) => c.name.toLowerCase() === q.toLowerCase());
  const matches = exact.length ? exact : found;
  if (matches.length === 1 && matches[0]) return focusOn(s, matches[0].id, ctx);
  return { ...s, announcement: null, candidates: matches };
};
