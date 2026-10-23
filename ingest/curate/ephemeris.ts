// Ephemeris files: each body's chunks concatenated in epoch order (the shared chunk boundaries once),
// written per contracts/curated-files.md; the held-out epochs, fetched at grid midpoints the release
// never holds, written to tests/fixtures/horizons-held-out.json for the fidelity tier.
import { ECLIPTIC_J2000, GEOCENTRIC_ECLIPTIC_J2000 } from '../../app/src/model/frames';
import { IDS } from '../../app/src/model/ids';
import type { EphemerisFile, SourceRecord } from '../../app/src/model/schema';
import { json, jsonRows } from '../lib/files';
import { emptyFragment } from '../lib/types';
import { BODIES } from '../sources/horizons';
import type { Curator } from './index';
import { parseHorizons } from './horizons-parse';
import { rawFiles, readRaw, retrieved } from './raw';

const SRC = 'jpl-horizons';
export const idOf = (slug: string) => IDS[slug as keyof typeof IDS];

export interface HeldOut { subject: string; frame: EphemerisFile['frame']; rows: [number, number, number, number][] }

export const ephemerisCurator: Curator = {
  name: 'ephemeris',
  needs: [SRC],
  async run(ctx) {
    const f = emptyFragment();
    const at = retrieved(ctx.manifest, SRC);
    const heldOut: HeldOut[] = [];
    const counts: Record<string, unknown> = {};
    for (const b of BODIES) {
      const subject = idOf(b.slug);
      const frame = b.center === '500@399' ? GEOCENTRIC_ECLIPTIC_J2000 : ECLIPTIC_J2000;
      const byJd = new Map<number, EphemerisFile['rows'][number]>();
      let targetSource = '';
      let centerSource = '';
      for (const path of rawFiles(ctx.manifest, SRC, 'vectors/').filter((p) => p.split('/').pop()?.startsWith(`${b.slug}-`))) {
        const r = parseHorizons(await readRaw(path));
        targetSource = r.targetSource;
        centerSource = r.centerSource;
        for (const row of r.rows) {
          const v = [row[0], row[2], row[3], row[4], row[5], row[6], row[7]].map(Number) as EphemerisFile['rows'][number];
          if (v.some((x) => !Number.isFinite(x))) throw new Error(`${path}: a row that is not seven numbers`);
          byJd.set(v[0], v);
        }
      }
      const rows = [...byJd.values()].sort((x, y) => x[0] - y[0]);
      const source: SourceRecord = {
        dataset: SRC,
        release: targetSource === centerSource ? targetSource : `${targetSource} (centre ${centerSource})`,
        record: `COMMAND=${b.command} CENTER=${b.center} VECTORS ${b.stepDays} d`,
        retrieved: at,
      };
      const head = { subject, frame, scale: 'TDB', unit: 'km', velocityUnit: 'km/s', stepDays: b.stepDays, source };
      f.files.push({ path: `${ctx.curatedDir}/ephemeris/${b.slug}.json`, text: jsonRows(head, 'rows', rows), sources: [SRC] });

      const hoRows: [number, number, number, number][] = [];
      for (const path of rawFiles(ctx.manifest, SRC, 'held-out/').filter((p) => p.split('/').pop()?.startsWith(`${b.slug}-`))) {
        for (const row of parseHorizons(await readRaw(path)).rows) hoRows.push([row[0], row[2], row[3], row[4]].map(Number) as [number, number, number, number]);
      }
      hoRows.sort((x, y) => x[0] - y[0]);
      for (const h of hoRows) if (byJd.has(h[0])) throw new Error(`${b.slug}: held-out epoch ${h[0]} is in the release`);
      heldOut.push({ subject, frame, rows: hoRows });
      counts[b.slug] = { rows: rows.length, first: rows[0]?.[0], last: rows[rows.length - 1]?.[0], heldOut: hoRows.length, ephemeris: source.release };
    }
    f.files.push({ path: `${ctx.fixturesDir}/horizons-held-out.json`, text: json(heldOut), sources: [SRC] });
    f.report = { bodies: counts };
    return f;
  },
};
