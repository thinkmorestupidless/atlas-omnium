// The legend: the key to the marks of each regime, the four status marks (R11), the selection and
// focus marks, the three line vocabularies, and the star sample's selection criteria in words with
// the catalogue release and the count. Opened by `l` or its control; shown once on first use.
import type { Model } from '../model/derived';
import type { Action } from '../input/actions';
import { STAR_BANDS, STAR_FAINTEST_PX, SUN_STELLAR_PX } from '../renderers/representation';
import { h, replace } from './dom';
import { statusGlyph } from './status-marks';

const SVG = 'http://www.w3.org/2000/svg';
const svg = (w: number, draw: (s: SVGSVGElement) => void): SVGSVGElement => {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('width', String(w)); s.setAttribute('height', '16'); s.setAttribute('viewBox', `0 0 ${w} 16`); s.setAttribute('aria-hidden', 'true');
  draw(s);
  return s;
};
const add = (s: SVGSVGElement, tag: string, attrs: Record<string, string | number>) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  s.append(e);
};
const INK = 'var(--ink)';
const disc = (r: number) => svg(16, (s) => add(s, 'circle', { cx: 8, cy: 8, r, fill: INK }));
const ring = (r: number, extra: Record<string, string | number> = {}) => svg(16, (s) => add(s, 'circle', { cx: 8, cy: 8, r, fill: 'none', stroke: INK, 'stroke-width': 1.25, ...extra }));
const line = (attrs: Record<string, string | number>) => svg(28, (s) => add(s, 'line', { x1: 2, y1: 8, x2: 26, y2: 8, stroke: INK, ...attrs }));

const row = (field: string, glyph: SVGSVGElement | null, words: string) =>
  h('li', { 'data-field': field }, glyph ? h('span', { class: 'legend-glyph' }, glyph) : null, h('span', {}, words));

const section = (title: string, ...items: HTMLElement[]) => h('section', {}, h('h3', {}, title), h('ul', {}, ...items));

const SEEN_KEY = 'atlas.legend.seen';
const seen = (): boolean => { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; } };
const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* the legend shows again next time */ } };

export const criteriaWords = (model: Model): { criteria: string; release: string; count: string } | null => {
  const st = model.stars;
  if (!st) return null;
  const gaia = model.release.manifest.sources.find((s) => s.name === 'gaia');
  const hip = model.release.manifest.sources.find((s) => s.name === 'hipparcos2');
  const c = st.sample.criteria;
  const fromGaia = st.sample.members.length - st.crossMatches.length;
  return {
    criteria: `every Gaia DR3 source with a parallax over ${c.parallaxMasGt} mas (nearer than ${1000 / c.parallaxMasGt} pc), a parallax over ${c.parallaxOverErrorGt} times its uncertainty, and a RUWE under ${c.ruweLt}`,
    release: `${gaia?.source_release ?? 'Gaia DR3'}${hip?.source_release ? `; cross-matched from ${hip.source_release}` : ''}`,
    count: `${fromGaia} stars from Gaia DR3, ${st.sample.removedByCuts.length} removed by the cuts; ${st.crossMatches.length} bright stars Gaia DR3 lacks, each entered through a cross-match record`,
  };
};

export const legend = (dispatch: (a: Action) => void, model: Model) => {
  const close = h('button', { type: 'button', class: 'legend-close', 'aria-label': 'close the legend' }, 'close');
  close.addEventListener('click', () => dispatch({ kind: 'legend', open: false }));
  const body = h('div', { class: 'legend-body' });
  const el = h('aside', { class: 'legend mono', id: 'legend', role: 'dialog', 'aria-label': 'legend', 'aria-modal': 'false', hidden: true },
    h('header', {}, h('h2', {}, 'legend'), close), body);
  const toggle = h('button', { type: 'button', class: 'legend-toggle', 'aria-controls': 'legend', 'aria-expanded': 'false' }, 'legend (l)');
  toggle.addEventListener('click', () => dispatch({ kind: 'legend' }));

  const crit = criteriaWords(model);
  replace(body,
    section('the Solar System',
      row('mark-disc', disc(5), 'a disc: a body at its measured radius, or drawn larger, with the factor labelled'),
      row('mark-point', disc(1.5), 'a point: a body whose radius is missing'),
      row('mark-track', line({ 'stroke-width': 0.75 }), "an orbit track: the orbit from JPL's approximate elements; the Moon's from its own positions over a month")),
    section('nearby stars',
      row('mark-sun', disc(SUN_STELLAR_PX), 'the Sun: drawn at the size of the brightest band; no catalogue in the sample gives its magnitude'),
      ...STAR_BANDS.map((b, k) => row(`mark-star-${k}`, disc(b.px), `a star, ${b.words} (Gaia G, or Hipparcos Hp)`)),
      row('mark-star-faint', disc(STAR_FAINTEST_PX), 'a star fainter than magnitude 14, or with no magnitude'),
      row('mark-range', ring(6, { 'stroke-dasharray': '2 2', 'stroke-width': 0.75 }), 'a dashed ring: the distance range, where it spans half a pixel or more'),
      row('mark-tick', svg(16, (s) => { add(s, 'line', { x1: 8, y1: 14, x2: 8, y2: 2, stroke: 'var(--muted)', 'stroke-width': 0.75 }); add(s, 'line', { x1: 6, y1: 2, x2: 10, y2: 2, stroke: 'var(--muted)', 'stroke-width': 0.75 }); }),
        'a tick: the height above (up) or below (down) the ecliptic, which the view flattens')),
    section('what it is made of',
      row('mark-substance', ring(6, { 'stroke-width': 1.25 }), 'a substance or a molecule type: a glyph of one size, which says nothing about its size'),
      row('mark-atom', ring(5, { 'stroke-width': 1.25 }), "an atom: its element's symbol in a glyph of one size; bonds are physical lines"),
      row('mark-flattened', line({ 'stroke-width': 0.75, stroke: 'var(--muted)' }), "the molecule seen face-on to its best-fit plane: distance from it is flattened")),
    section('how a value is known',
      row('status-observed', statusGlyph('observed', 16), 'observed'),
      row('status-derived', statusGlyph('derived', 16), 'derived'),
      row('status-inferred', statusGlyph('inferred', 16), 'inferred'),
      row('status-illustrative', statusGlyph('illustrative', 16), 'illustrative')),
    section('selection and focus',
      row('selection', svg(16, (s) => { add(s, 'circle', { cx: 8, cy: 8, r: 2.5, fill: INK }); add(s, 'circle', { cx: 8, cy: 8, r: 7, fill: 'none', stroke: 'var(--cobalt)', 'stroke-width': 1.5 }); }), 'the selection: a ring set apart from the mark'),
      row('focus', svg(16, (s) => { add(s, 'circle', { cx: 8, cy: 8, r: 3, fill: INK }); add(s, 'circle', { cx: 8, cy: 8, r: 5, fill: 'none', stroke: INK, 'stroke-width': 2.5 }); }), 'the focus: a heavy ring on the mark')),
    section('lines',
      row('line-physical', line({ 'stroke-width': 0.75 }), 'physical: an orbit track, a bond'),
      row('line-knowledge', line({ 'stroke-width': 1, 'stroke-dasharray': '1 3', 'stroke-linecap': 'round' }), 'knowledge: a relationship between records'),
      row('line-graphical', line({ 'stroke-width': 0.75, stroke: 'var(--muted)' }), 'graphical: a tick, a leader to a label')),
    crit ? h('section', { 'data-field': 'star-sample' }, h('h3', {}, 'the star sample'),
      h('p', { 'data-field': 'criteria' }, crit.criteria),
      h('p', { 'data-field': 'catalogue-release' }, `catalogue release: ${crit.release}`),
      h('p', { 'data-field': 'count' }, crit.count)) : null);

  let shownOnce = seen();
  return {
    el, toggle,
    update(open: boolean) {
      if (!shownOnce) { shownOnce = true; markSeen(); dispatch({ kind: 'legend', open: true }); return; }
      el.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    },
  };
};
