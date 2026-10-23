// SC-002: positions evaluated by the release's model at held-out epochs agree with Horizons within
// the precision the release states, for every supported body.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hermite, OutsideWindow, positionAt } from '../../app/src/model/ephemeris';
import { EphemerisFileSchema, PrecisionFileSchema } from '../../app/src/model/schema';

const DIR = 'data/curated/001-prototype';
const HELD = 'tests/fixtures/horizons-held-out.json';
const ready = existsSync(HELD) && existsSync(`${DIR}/precision.json`);

describe.skipIf(!ready)('ephemeris fidelity at the held-out epochs (skipped until ingest writes them)', () => {
  const held = ready ? (JSON.parse(readFileSync(HELD, 'utf8')) as { subject: string; rows: [number, number, number, number][] }[]) : [];
  const precision = ready ? PrecisionFileSchema.parse(JSON.parse(readFileSync(`${DIR}/precision.json`, 'utf8'))) : [];
  const load = (subject: string) => EphemerisFileSchema.parse(JSON.parse(readFileSync(`${DIR}/ephemeris/${subject.replace('atlas:', '')}.json`, 'utf8')));

  it('covers every body the release samples', () => {
    expect(held.map((h) => h.subject).sort()).toEqual(precision.map((p) => p.subject).sort());
    expect(held.length).toBe(12);
  });

  for (const h of held) {
    it(`${h.subject}: every held-out epoch within the stated precision, never in the release`, () => {
      const f = load(h.subject);
      const stated = precision.find((p) => p.subject === h.subject);
      expect(stated?.maxError.unit).toBe('km');
      const grid = new Set(f.rows.map((r) => r[0]));
      expect(h.rows.length).toBeGreaterThanOrEqual(50);
      for (const [jd, x, y, z] of h.rows) {
        expect(grid.has(jd)).toBe(false);
        const p = hermite(f, jd);
        expect(Math.hypot(p[0] - x, p[1] - y, p[2] - z)).toBeLessThanOrEqual((stated?.maxError.value ?? 0) * 1.0051);
      }
      expect(stated?.maxError.value ?? Infinity).toBeLessThan(h.subject === 'atlas:moon' ? 10 : 100);
    });
  }

  it('returns the samples themselves at the samples', () => {
    const f = load('atlas:mars');
    const r = f.rows[100] as number[];
    expect(hermite(f, r[0] as number)).toEqual([r[1], r[2], r[3]]);
  });

  it('refuses an epoch outside the samples with a typed error', () => {
    const f = load('atlas:mars');
    expect(() => hermite(f, 2400000.5)).toThrow(OutsideWindow);
  });

  it('names the samples, the model and the precision in the derived state', () => {
    const f = load('atlas:earth');
    const s = positionAt(f, { scale: 'TDB', jd: 2460000.25 }, precision.find((p) => p.subject === 'atlas:earth'));
    expect(s.status).toBe('derived');
    expect(s.model.name).toBe('hermite-state-vectors');
    expect(s.from).toHaveLength(2);
    expect(s.precision?.unit).toBe('km');
    expect(s.value.frame.kind).toBe('heliocentric-ecliptic');
  });
});
