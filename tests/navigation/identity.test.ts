// FR-009: the Sun is one entity at every scale. Driving the real resolver and representation over the
// curated release, its mark keeps its atlas id and its screen point through the band between the
// Solar System and the nearby stars, scaling out and scaling back in.
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { IDS } from '../../app/src/model/ids';
import { starStates } from '../../app/src/model/parallax';
import { bodyPositions, epochOf } from '../../app/src/model/positions';
import { loadRelease } from '../../app/src/model/release';
import { BAND, regimeFor } from '../../app/src/navigation/resolver';
import { initialState, type NavigationState } from '../../app/src/navigation/state';
import { eclipticTopDown } from '../../app/src/projections/ecliptic-top-down';
import { resolve } from '../../app/src/renderers/representation';

const SAME_PLACE_PX = 0.5;
const viewport = { width: 1280, height: 800 };

describe('the Sun across the band', () => {
  it('keeps its id and its screen point at every scale, out and back', async () => {
    const model = await loadRelease('001-prototype', (p) => readFile(`data/${p}`, 'utf8'));
    const base = initialState({ release: '001-prototype', window: model.release.window, today: '2026-10-22' });
    const positions = bodyPositions(model, epochOf(base.utc));
    const stars = starStates(model);
    const steps = 120;
    const lo = BAND.inner / 2;
    const hi = BAND.outer * 2;
    const out = Array.from({ length: steps + 1 }, (_, k) => lo * (hi / lo) ** (k / steps));
    let state: NavigationState = { ...base, selection: IDS.sun };
    let first: { x: number; y: number } | null = null;
    const shapes = new Set<string>();
    for (const scale of [...out, ...[...out].reverse()]) {
      state = { ...state, scale, regime: regimeFor(state.regime, scale, 'spatial') };
      const scene = resolve({ state, model, projection: eclipticTopDown, viewport, positions, stars });
      const suns = scene.marks.filter((m) => m.id === IDS.sun);
      expect(suns, `one Sun at ${scale.toExponential(2)} m/px`).toHaveLength(1);
      const sun = suns[0]!;
      expect(sun.visible).toBe(true);
      expect(sun.selected).toBe(true);
      shapes.add(sun.shape);
      if (scale < BAND.inner) continue;
      first ??= sun.at;
      expect(Math.hypot(sun.at.x - first.x, sun.at.y - first.y), `at ${scale.toExponential(2)} m/px`).toBeLessThan(SAME_PLACE_PX);
    }
    expect([...shapes].sort()).toEqual(['disc', 'stellar']);
    expect(state.regime).toBe('planetary');
  });
});
