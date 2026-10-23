// precision.json: per body, the largest distance between the Hermite model and Horizons at the
// held-out epochs. This is the stated precision the atlas shows (FR-006), measured, never a bound.
import { hermite, HERMITE } from '../../app/src/model/ephemeris';
import { EphemerisFileSchema, type Precision } from '../../app/src/model/schema';
import { json } from '../lib/files';
import { emptyFragment } from '../lib/types';
import type { HeldOut } from './ephemeris';
import type { Curator } from './index';

export const measurePrecision = (ephemerides: ReturnType<typeof EphemerisFileSchema.parse>[], heldOut: HeldOut[]): Precision[] =>
  heldOut.map((h) => {
    const f = ephemerides.find((e) => e.subject === h.subject);
    if (!f) throw new Error(`no ephemeris for ${h.subject}`);
    let max = 0;
    for (const [jd, x, y, z] of h.rows) {
      const p = hermite(f, jd);
      max = Math.max(max, Math.hypot(p[0] - x, p[1] - y, p[2] - z));
    }
    return { subject: h.subject, maxError: { value: Number(max.toPrecision(3)), unit: 'km' as const }, heldOut: h.rows.length, model: { ...HERMITE } };
  }).sort((a, b) => a.subject.localeCompare(b.subject));

export const precisionCurator: Curator = {
  name: 'precision',
  needs: ['jpl-horizons'],
  async run(ctx, before) {
    const f = emptyFragment();
    const files = before.flatMap((x) => x.files);
    const ephemerides = files.filter((x) => x.path.includes('/ephemeris/')).map((x) => EphemerisFileSchema.parse(JSON.parse(x.text)));
    const held = files.find((x) => x.path.endsWith('horizons-held-out.json'));
    if (!held) throw new Error('the ephemeris curator wrote no held-out epochs');
    const rows = measurePrecision(ephemerides, JSON.parse(held.text) as HeldOut[]);
    f.files.push({ path: `${ctx.curatedDir}/precision.json`, text: json(rows), sources: ['jpl-horizons'] });
    f.report = { maxErrorKm: Object.fromEntries(rows.map((r) => [r.subject, r.maxError.value])) };
    return f;
  },
};
