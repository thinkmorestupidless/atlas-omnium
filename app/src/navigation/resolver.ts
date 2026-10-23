// The regime in force and how far each layer has faded, as pure functions of scale (metres per CSS
// pixel). Scaling back reverses everything exactly because nothing here depends on the path taken,
// except the regime switch, which has hysteresis so hovering at a boundary does not flicker.
import type { Mode, Regime } from './state';

/**
 * The planetary to nearby-stellar band. Inner edge 1e12 m/px, where the Sun is under 0.15 px from
 * an Earth-centred view's centre, so it does not visibly move across the band (FR-009).
 */
export const BAND = {
  inner: 1e12,
  discsGone: 3e12,
  midpoint: 5e12,
  tracksGone: 1e13,
  outer: 3e13,
  switchIn: 3e12,
  switchOut: 1e13,
} as const;

export const regimeFor = (previous: Regime, scale: number, mode: Mode): Regime => {
  if (mode === 'structural') return 'molecular';
  if (previous === 'nearby-stellar') return scale < BAND.switchIn ? 'planetary' : 'nearby-stellar';
  if (previous === 'planetary') return scale > BAND.switchOut ? 'nearby-stellar' : 'planetary';
  return scale > BAND.midpoint ? 'nearby-stellar' : 'planetary';
};

export interface Fades {
  /** Planet, moon and small-body discs. */
  discs: number;
  /** Orbit tracks: opacity, and their width as a fraction of the full stroke. */
  tracks: number;
  trackWidth: number;
  /** The Sun drawn as a disc, and as a stellar point. */
  sunDisc: number;
  sunPoint: number;
  /** The nearby stars. */
  stars: number;
  /** The chapter cue: 1 at the midpoint, 0 at the edges of the band. */
  cue: number;
}

const ramp = (s: number, from: number, to: number): number => {
  if (s <= from) return 0;
  if (s >= to) return 1;
  return Math.log(s / from) / Math.log(to / from);
};

export const fadesAt = (scale: number, opts: { reducedMotion?: boolean } = {}): Fades => {
  if (opts.reducedMotion) {
    const beyond = scale > BAND.midpoint ? 1 : 0;
    return { discs: 1 - beyond, tracks: 1 - beyond, trackWidth: 1, sunDisc: 1 - beyond, sunPoint: beyond, stars: beyond, cue: 0 };
  }
  const discs = 1 - ramp(scale, BAND.inner, BAND.discsGone);
  const tracks = 1 - ramp(scale, BAND.inner, BAND.tracksGone);
  const stars = ramp(scale, BAND.midpoint, BAND.outer);
  const cue = scale <= BAND.inner || scale >= BAND.outer ? 0 : 1 - Math.abs(Math.log(scale / BAND.midpoint)) / Math.log(BAND.outer / BAND.midpoint);
  return { discs, tracks, trackWidth: 0.25 + 0.75 * tracks, sunDisc: discs, sunPoint: 1 - discs, stars, cue: Math.max(0, cue) };
};
