import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { orbitTrack } from '../../app/src/model/elements';
import { ElementsFileSchema, type Elements } from '../../app/src/model/schema';

// Table 1's Earth–Moon barycentre row at J2000, as transcribed.
const EARTH: Elements = {
  subject: 'atlas:earth', frame: { kind: 'heliocentric-ecliptic', equinox: 'J2000', system: 'ICRF' }, epoch: { scale: 'TDB', jd: 2451545 },
  a: { value: 1.00000261, unit: 'au' }, e: 0.01671123, i: -0.00001531, node: 0, argPeri: 102.93768193,
  validity: { from: '1800-01-01', to: '2050-12-31' }, model: 'keplerian-elements (Table 1)',
  source: { dataset: 'jpl-keplerian-elements', release: 'Table 1', record: 'EM Bary', retrieved: '2026-10-23T00:00:00Z' },
};

describe('orbit tracks from Keplerian elements', () => {
  const t = orbitTrack(EARTH);
  const r = t.value.points.map((p) => Math.hypot(p[0], p[1], p[2]));

  it("Earth's track has its perihelion and aphelion distances", () => {
    expect(Math.min(...r)).toBeCloseTo(0.98329, 4);
    expect(Math.max(...r)).toBeCloseTo(1.01671, 4);
  });

  it("Earth's track lies in the ecliptic plane", () => {
    expect(Math.max(...t.value.points.map((p) => Math.abs(p[2])))).toBeLessThan(1e-6);
  });

  it('is a derived state naming its model, its source and its validity', () => {
    expect(t.status).toBe('derived');
    expect(t.model.name).toBe('keplerian-elements');
    expect(t.from[0]).toContain('jpl-keplerian-elements');
    expect(t.value.validity).toEqual({ from: '1800-01-01', to: '2050-12-31' });
  });

  it('the release holds a track for every body but the Moon, whose track is its own samples', () => {
    const rows = ElementsFileSchema.parse(JSON.parse(readFileSync('data/curated/001-prototype/elements.json', 'utf8')));
    expect(rows.map((x) => x.subject).sort()).toEqual(['atlas:ceres', 'atlas:earth', 'atlas:halley', 'atlas:jupiter', 'atlas:mars', 'atlas:mercury', 'atlas:neptune', 'atlas:pluto', 'atlas:saturn', 'atlas:uranus', 'atlas:venus']);
  });
});
