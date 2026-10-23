import { describe, expect, it } from 'vitest';
import { ObservationSchema } from '../../app/src/model/schema';
import { Observations } from '../../app/src/model/observations';
import { checkNoDefaults } from '../../ingest/validation/no-defaults';

const source = { dataset: 'nssdca-factsheet', release: '2026-10-23', record: 'Halley: mean radius', retrieved: '2026-10-23T00:00:00Z' } as const;
const missingRadius = { id: 'obs:nssdca:halley:meanRadius', subject: 'atlas:halley', property: 'meanRadius', value: null, unit: 'km', source };

describe('a missing value stays missing', () => {
  it('passes the schema as null', () => {
    const parsed = ObservationSchema.parse(missingRadius);
    expect(parsed.value).toBeNull();
  });

  it('comes out of a lookup as null, never 0, NaN or undefined', () => {
    const obs = new Observations([ObservationSchema.parse(missingRadius)]);
    const m = obs.measured('atlas:halley' as never, 'meanRadius');
    expect(m.value).toBeNull();
    expect(m.observation?.source.record).toBe('Halley: mean radius');
  });

  it('is missing when there is no observation at all', () => {
    const obs = new Observations([]);
    const m = obs.measured('atlas:halley' as never, 'meanRadius');
    expect(m.value).toBeNull();
    expect(m.observation).toBeNull();
  });

  it('fails the no-defaults check when a curated value appears where the raw record has none', () => {
    const raw = [{ subject: 'atlas:halley', property: 'meanRadius', value: null }];
    const curated = [{ ...missingRadius, value: 0 }];
    const findings = checkNoDefaults(raw, curated);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/atlas:halley meanRadius/);
    expect(checkNoDefaults(raw, [missingRadius])).toHaveLength(0);
  });
});
