import { describe, expect, it } from 'vitest';
import { IDS } from '../../app/src/model/ids';
import { initialState, OPENING_SCALE } from '../../app/src/navigation/state';
import * as t from '../../app/src/navigation/transitions';
import { minimumScale } from '../../app/src/navigation/minimum-scale';
import { PROXIMA, testContext } from './context';

const ctx = testContext();
const open = () => initialState({ release: '001-prototype', window: { from: '2000-01-01', to: '2050-12-31' }, today: '2026-10-22' });

describe('the opening state', () => {
  it('focuses and selects Earth in spatial navigation at the opening scale', () => {
    const s = open();
    expect(s.focus).toBe(IDS.earth);
    expect(s.selection).toBe(IDS.earth);
    expect(s.mode).toBe('spatial');
    expect(s.regime).toBe('planetary');
    expect(s.scale).toBe(OPENING_SCALE);
    expect(s.breadcrumb.map((c) => c.id)).toEqual([IDS.earth]);
  });
});

describe('scaling', () => {
  it('never changes the focus or the selection', () => {
    let s = t.select(open(), IDS.sun);
    for (const f of [10, 1e3, 1e5, 1e4, 1e-3, 1e-6]) {
      s = t.scaleBy(s, f, ctx);
      expect(s.focus).toBe(IDS.earth);
      expect(s.selection).toBe(IDS.sun);
    }
  });

  it('stops at the minimum scale and offers the structural step without entering it', () => {
    const s = t.scaleBy(open(), 1e-6, ctx);
    expect(s.scale).toBe(minimumScale(6371, 800));
    expect(s.offer).toBe('made-of');
    expect(s.mode).toBe('spatial');
  });

  it('withdraws the offer when scaling back out', () => {
    const s = t.scaleBy(t.scaleBy(open(), 1e-6, ctx), 2, ctx);
    expect(s.offer).toBeNull();
  });

  it('offers nothing at the minimum scale of a body with nothing to descend into', () => {
    const mars = t.focus(t.select(open(), IDS.mars), ctx);
    expect(t.scaleBy(mars, 1e-6, ctx).offer).toBeNull();
  });
});

describe('focus and history', () => {
  it('appends to the breadcrumb on focus and returns along it on back', () => {
    const a = t.focus(t.select(open(), IDS.mars), ctx);
    expect(a.focus).toBe(IDS.mars);
    expect(a.breadcrumb.map((c) => c.id)).toEqual([IDS.earth, IDS.mars]);
    const b = t.back(a, ctx);
    expect(b.focus).toBe(IDS.earth);
    expect(b.breadcrumb.map((c) => c.id)).toEqual([IDS.earth]);
  });

  it('restores the scale and regime the previous focus was left at', () => {
    const out = t.scaleBy(open(), 1e5, ctx);
    const there = t.focus(t.select(out, PROXIMA), ctx);
    expect(there.regime).toBe('nearby-stellar');
    const back = t.back(there, ctx);
    expect(back.scale).toBe(out.scale);
    expect(back.regime).toBe(out.regime);
  });

  it('does nothing on focus without a selection, and nothing on back at the start', () => {
    const s = t.select(open(), null);
    expect(t.focus(s, ctx)).toBe(s);
    expect(t.back(open(), ctx)).toEqual(open());
  });
});

describe('structural navigation', () => {
  it('is entered only by the explicit choice, which announces it', () => {
    const s = t.enterStructural(open(), ctx);
    expect(s.mode).toBe('structural');
    expect(s.regime).toBe('molecular');
    expect(s.announcement?.modeChange).toBe('entered-structural');
    expect(s.focus).toBe(IDS.earth);
  });

  it('is refused from an entity with nothing to descend into', () => {
    const mars = t.focus(t.select(open(), IDS.mars), ctx);
    expect(t.enterStructural(mars, ctx)).toBe(mars);
  });

  it('is left by going back, to Earth in spatial navigation, announced', () => {
    const inBranch = t.focus(t.select(t.enterStructural(open(), ctx), IDS.water), ctx);
    expect(inBranch.focus).toBe(IDS.water);
    const out = t.back(inBranch, ctx);
    expect(out.focus).toBe(IDS.earth);
    expect(out.mode).toBe('spatial');
    expect(out.regime).toBe('planetary');
    expect(out.announcement?.modeChange).toBe('left-structural');
  });

  it('is left by going back even before anything in it was focused', () => {
    const out = t.back(t.enterStructural(open(), ctx), ctx);
    expect(out.mode).toBe('spatial');
    expect(out.announcement?.modeChange).toBe('left-structural');
  });

  it('never moves through structure by scaling', () => {
    const s = t.enterStructural(open(), ctx);
    expect(t.scaleBy(s, 1e-3, ctx)).toBe(s);
  });
});

describe('dates', () => {
  it('refuses a date outside the window and keeps the date', () => {
    const s = t.setDate(open(), '2100-01-01');
    expect(s.utc).toBe(open().utc);
    expect(s.refusal).toEqual({ date: '2100-01-01', window: { from: '2000-01-01', to: '2050-12-31' } });
  });

  it('accepts a date inside it and clears a refusal', () => {
    const s = t.setDate(t.setDate(open(), '2100-01-01'), '2030-01-01');
    expect(s.utc).toBe('2030-01-01T00:00:00.000Z');
    expect(s.refusal).toBeNull();
  });

  it('advances while playing at the rate and not while paused', () => {
    const playing = t.play(t.setRate(open(), 1));
    const later = t.tick(playing, 10);
    expect(later.utc).toBe('2026-11-01T00:00:00.000Z');
    expect(t.tick(t.pause(later), 10).utc).toBe(later.utc);
  });

  it('stops at the end of the window, saying why', () => {
    const s = t.tick(t.play(t.setRate(t.setDate(open(), '2050-12-30'), 1)), 5);
    expect(s.utc).toBe('2050-12-31T00:00:00.000Z');
    expect(s.playing).toBe(false);
    expect(s.refusal?.window.to).toBe('2050-12-31');
  });
});

describe('selection and search', () => {
  it('never changes the regime by selecting', () => {
    const s = t.scaleBy(open(), 1e5, ctx);
    expect(t.select(s, PROXIMA).regime).toBe(s.regime);
  });

  it('focuses a single match in its context', () => {
    expect(t.search(open(), 'Mars', ctx).focus).toBe(IDS.mars);
    const p = t.search(open(), 'Proxima Centauri', ctx);
    expect([p.focus, p.regime]).toEqual([PROXIMA, 'nearby-stellar']);
    const w = t.search(open(), 'water', ctx);
    expect([w.focus, w.regime, w.mode]).toEqual([IDS.water, 'molecular', 'structural']);
    expect(w.announcement?.modeChange).toBe('entered-structural');
  });

  it('offers every match with its kind and leaves the focus when a name is shared', () => {
    const s = t.search(open(), 'Mercury', ctx);
    expect(s.focus).toBe(IDS.earth);
    expect(s.candidates?.map((c) => c.kind).sort()).toEqual(['AtomType', 'Planet']);
  });
});
