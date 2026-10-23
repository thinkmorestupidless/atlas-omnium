import { describe, expect, it } from 'vitest';
import { BAND, fadesAt, regimeFor } from '../../app/src/navigation/resolver';
import { IDS } from '../../app/src/model/ids';
import { initialState } from '../../app/src/navigation/state';
import * as t from '../../app/src/navigation/transitions';
import { testContext } from './context';

describe('the regime', () => {
  it('is planetary inside the Solar System and nearby stellar beyond it', () => {
    expect(regimeFor('planetary', 1e10, 'spatial')).toBe('planetary');
    expect(regimeFor('planetary', 1e15, 'spatial')).toBe('nearby-stellar');
  });

  it('switches at a different scale going out than coming in', () => {
    expect(BAND.switchOut).toBeGreaterThan(BAND.switchIn);
    const between = Math.sqrt(BAND.switchOut * BAND.switchIn);
    expect(regimeFor('planetary', between, 'spatial')).toBe('planetary');
    expect(regimeFor('nearby-stellar', between, 'spatial')).toBe('nearby-stellar');
    expect(regimeFor('planetary', BAND.switchOut * 1.01, 'spatial')).toBe('nearby-stellar');
    expect(regimeFor('nearby-stellar', BAND.switchIn * 0.99, 'spatial')).toBe('planetary');
  });

  it('is molecular whenever navigation is structural', () => {
    expect(regimeFor('planetary', 1e10, 'structural')).toBe('molecular');
  });
});

describe('the fades', () => {
  it('are a pure function of scale, so scaling back reverses them exactly', () => {
    const scales = Array.from({ length: 50 }, (_, i) => BAND.inner * (BAND.outer / BAND.inner) ** (i / 49));
    const out = scales.map((s) => fadesAt(s));
    const back = [...scales].reverse().map((s) => fadesAt(s)).reverse();
    expect(back).toEqual(out);
  });

  it('take planet discs before orbit tracks, and bring the stars in after', () => {
    const mid = Math.sqrt(BAND.inner * BAND.outer);
    const f = fadesAt(mid);
    expect(f.discs).toBeLessThanOrEqual(f.tracks);
    expect(fadesAt(BAND.inner * 0.9)).toMatchObject({ discs: 1, tracks: 1, stars: 0 });
    expect(fadesAt(BAND.outer * 1.1)).toMatchObject({ discs: 0, tracks: 0, stars: 1 });
  });

  it('become a single cut at the midpoint under reduced motion', () => {
    for (const s of [BAND.inner, BAND.midpoint * 0.999, BAND.midpoint * 1.001, BAND.outer]) {
      const f = fadesAt(s, { reducedMotion: true });
      for (const v of [f.discs, f.tracks, f.stars, f.sunDisc]) expect(v === 0 || v === 1).toBe(true);
    }
    expect(fadesAt(BAND.midpoint * 0.999, { reducedMotion: true }).stars).toBe(0);
    expect(fadesAt(BAND.midpoint * 1.001, { reducedMotion: true }).stars).toBe(1);
  });
});

describe('identity across the transition', () => {
  it('keeps the focus and the selection as the same ids in both directions', () => {
    const ctx = testContext();
    let s = t.select(initialState({ release: 'r', window: { from: '2000-01-01', to: '2050-12-31' }, today: '2026-10-22' }), IDS.sun);
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) { s = t.scaleBy(s, 2, ctx); seen.push(`${s.focus} ${s.selection} ${s.regime}`); }
    expect(s.regime).toBe('nearby-stellar');
    for (let i = 0; i < 40; i++) { s = t.scaleBy(s, 0.5, ctx); seen.push(`${s.focus} ${s.selection} ${s.regime}`); }
    expect(s.regime).toBe('planetary');
    expect(new Set(seen.map((x) => x.split(' ').slice(0, 2).join(' ')))).toEqual(new Set([`${IDS.earth} ${IDS.sun}`]));
  });
});
