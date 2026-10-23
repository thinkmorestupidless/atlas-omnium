// WCAG AA contrast for every token pair the atlas sets text in, read from the stylesheets, and the
// check that every status, regime and legend entry carries a shape or a word besides any colour
// (SC-007, FR-013). Canvas labels use the same tokens as the controls.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CUE_WORDS } from '../../app/src/ui/chapter-cue';
import { MARK_SHAPES, STATUS_MARKS } from '../../app/src/ui/status-marks';
import { STAR_BANDS } from '../../app/src/renderers/representation';

const tokens = readFileSync('app/src/styles/tokens.css', 'utf8');
const css = tokens + readFileSync('app/src/styles/controls.css', 'utf8');
const hex = (name: string): string => {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m?.[1]) throw new Error(`no token --${name}`);
  return m[1];
};
const lum = (h: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
};
export const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return ((x as number) + 0.05) / ((y as number) + 0.05); };

/** Text colour on background, the minimum ratio, and where the stylesheets use it. */
const TEXT: [fg: string, bg: string, min: number, where: string][] = [
  ['ink', 'cream', 4.5, 'body text, labels, the time controller'],
  ['ink', 'paper', 4.5, 'buttons, the legend, the inspector'],
  ['muted', 'cream', 4.5, 'metadata terms and sources, the rail ticks, canvas labels'],
  ['muted', 'paper', 4.5, 'inspector terms and attributions'],
  ['ink', 'yellow', 4.5, 'the release banner'],
  ['vermilion', 'cream', 3, "the lock-up's full stop, display type"],
];
/** Non-text: the focus ring and the marks against the canvas (WCAG 1.4.11). */
const NON_TEXT: [fg: string, bg: string][] = [['cobalt', 'cream'], ['cobalt', 'paper'], ['ink', 'cream'], ['muted', 'cream']];

describe('contrast', () => {
  it.each(TEXT)('%s on %s is at least %d:1 (%s)', (fg, bg, min) => {
    expect(contrast(hex(fg), hex(bg))).toBeGreaterThanOrEqual(min);
  });
  it.each(NON_TEXT)('%s on %s is at least 3:1', (fg, bg) => {
    expect(contrast(hex(fg), hex(bg))).toBeGreaterThanOrEqual(3);
  });
  it('sets no text in a colour the table does not cover', () => {
    const used = new Set([...css.matchAll(/(?<![-\w])color:\s*var\(--([a-z]+)\)/g)].map((m) => m[1]));
    for (const c of used) expect(TEXT.some(([fg]) => fg === c), `--${c} is checked`).toBe(true);
  });
});

describe('nothing is told by colour alone', () => {
  it('gives every status its own shape and its word', () => {
    const shapes = Object.values(STATUS_MARKS).map((s) => s.shape);
    expect(new Set(shapes).size).toBe(4);
    for (const [status, m] of Object.entries(STATUS_MARKS)) expect(m.word).toBe(status);
  });
  it('keeps the selection and focus marks apart from every status shape', () => {
    expect(new Set(Object.values(MARK_SHAPES)).size).toBe(Object.keys(MARK_SHAPES).length);
  });
  it('names every regime in words', () => {
    for (const w of Object.values(CUE_WORDS)) expect(w.length).toBeGreaterThan(0);
    expect(css).toMatch(/\.rail-band-name/);
  });
  it('says each star band in words as well as by size', () => {
    for (const b of STAR_BANDS) expect(b.words).toMatch(/magnitude/);
  });
});
