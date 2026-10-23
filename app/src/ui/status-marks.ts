// The four status marks of R11, which differ in shape and carry their word, so no status is told by
// colour alone; and the registry of every mark shape, which the selection and focus marks join
// without sharing a shape with any status.
import type { Status } from '../model/schema';
import { FOCUS_MARK, SELECTION_MARK } from '../renderers/representation';
import { h } from './dom';

export const STATUS_MARKS: Record<Status, { readonly shape: string; readonly word: string }> = {
  observed: { shape: 'filled-disc', word: 'observed' },
  derived: { shape: 'half-disc', word: 'derived' },
  inferred: { shape: 'open-ring', word: 'inferred' },
  illustrative: { shape: 'dashed-ring', word: 'illustrative' },
};

/** Every mark shape the atlas uses to say something about an entity, by what it says. */
export const MARK_SHAPES = {
  ...Object.fromEntries(Object.entries(STATUS_MARKS).map(([k, v]) => [k, v.shape])),
  selection: SELECTION_MARK.shape,
  focus: FOCUS_MARK.shape,
} as Record<Status | 'selection' | 'focus', string>;

const SVG = 'http://www.w3.org/2000/svg';
const el = (tag: string, attrs: Record<string, string | number>) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

export const statusGlyph = (status: Status, size = 12): SVGSVGElement => {
  const s = el('svg', { width: size, height: size, viewBox: '0 0 12 12', 'aria-hidden': 'true' }) as SVGSVGElement;
  const ring = { cx: 6, cy: 6, r: 4.25, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.25 };
  if (status === 'observed') s.append(el('circle', { cx: 6, cy: 6, r: 4.5, fill: 'var(--ink)' }));
  if (status === 'derived') s.append(el('circle', ring), el('path', { d: 'M6 1.75 A4.25 4.25 0 0 0 6 10.25 Z', fill: 'var(--ink)' }));
  if (status === 'inferred') s.append(el('circle', ring));
  if (status === 'illustrative') s.append(el('circle', { ...ring, 'stroke-dasharray': '2 1.5' }));
  return s;
};

/** A status as its mark and its word together. */
export const statusMark = (status: Status) =>
  h('span', { class: 'status-mark', 'data-status': status, 'data-shape': STATUS_MARKS[status].shape }, statusGlyph(status), ` ${STATUS_MARKS[status].word}`);
