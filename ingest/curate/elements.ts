// elements.json: Keplerian elements at J2000 for orbit tracks only (decision 0004). The planets from
// JPL's approximate elements, Table 1 (the Earth's row is the Earth–Moon barycentre's, and says so);
// Ceres, Pluto and Halley from Horizons' osculating elements at J2000. The Moon's track is drawn from
// its own samples instead (no table gives its elements).
import { ECLIPTIC_J2000 } from '../../app/src/model/frames';
import type { Elements } from '../../app/src/model/schema';
import { json } from '../lib/files';
import { emptyFragment } from '../lib/types';
import { BODIES, ELEMENT_BODIES, J2000_JD } from '../sources/horizons';
import { PAGE } from '../sources/jpl-elements';
import { idOf } from './ephemeris';
import type { Curator } from './index';
import { parseHorizons } from './horizons-parse';
import { htmlText, rawFiles, readRaw, retrieved } from './raw';

const E = 'jpl-keplerian-elements';
const H = 'jpl-horizons';
const ROWS: Record<string, string> = {
  Mercury: 'mercury', Venus: 'venus', 'EM Bary': 'earth', Mars: 'mars', Jupiter: 'jupiter', Saturn: 'saturn', Uranus: 'uranus', Neptune: 'neptune',
};

/** Degrees into [0, 360), rounded to the table's eight decimals so a subtraction adds no digits it does not have. */
const wrap = (deg: number) => Number((deg < 0 ? deg + 360 : deg >= 360 ? deg - 360 : deg).toFixed(8));

export const parseTable1 = (html: string): { name: string; a: number; e: number; i: number; L: number; varpi: number; node: number }[] => {
  const t = htmlText(html);
  const start = t.indexOf('Table 1');
  const end = t.indexOf('Table 2a');
  const block = t.slice(start, end);
  const out: { name: string; a: number; e: number; i: number; L: number; varpi: number; node: number }[] = [];
  for (const name of Object.keys(ROWS)) {
    const m = block.match(new RegExp(`\\n\\s*${name.replace(' ', '\\s')}\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)`));
    if (!m) throw new Error(`Table 1 has no row ${name}`);
    const [a, e, i, L, varpi, node] = m.slice(1, 7).map(Number) as [number, number, number, number, number, number];
    out.push({ name, a, e, i, L, varpi, node });
  }
  return out;
};

export const elementsCurator: Curator = {
  name: 'elements',
  needs: [E, H],
  async run(ctx) {
    const f = emptyFragment();
    const eAt = retrieved(ctx.manifest, E);
    const hAt = retrieved(ctx.manifest, H);
    const rows: Elements[] = [];
    const page = rawFiles(ctx.manifest, E)[0];
    if (!page) throw new Error('no raw page for the approximate elements');
    for (const r of parseTable1(await readRaw(page))) {
      const slug = ROWS[r.name] as string;
      rows.push({
        subject: idOf(slug), frame: ECLIPTIC_J2000, epoch: { scale: 'TDB', jd: J2000_JD },
        a: { value: r.a, unit: 'au' }, e: r.e, i: r.i, node: wrap(r.node), argPeri: wrap(r.varpi - r.node),
        validity: { from: '1800-01-01', to: '2050-12-31' },
        model: r.name === 'EM Bary' ? 'keplerian-elements (Table 1; the Earth–Moon barycentre)' : 'keplerian-elements (Table 1)',
        source: { dataset: E, release: 'Table 1, valid 1800 AD to 2050 AD', record: `${PAGE} Table 1 "${r.name}"`, retrieved: eAt },
      });
    }
    for (const slug of ELEMENT_BODIES) {
      const file = rawFiles(ctx.manifest, H, 'elements/').find((p) => p.endsWith(`/${slug}.json`));
      if (!file) throw new Error(`no Horizons elements for ${slug}`);
      const r = parseHorizons(await readRaw(file));
      const row = r.rows[0] ?? [];
      const col = (k: string) => {
        const i = r.header.indexOf(k);
        if (i < 0) throw new Error(`${slug}: no column ${k} in ${r.header.join(',')}`);
        return Number(row[i]);
      };
      const b = BODIES.find((x) => x.slug === slug);
      rows.push({
        subject: idOf(slug), frame: ECLIPTIC_J2000, epoch: { scale: 'TDB', jd: col('JDTDB') },
        a: { value: col('A'), unit: 'au' }, e: col('EC'), i: col('IN'), node: col('OM'), argPeri: col('W'),
        validity: { from: '2000-01-01', to: '2050-12-31' },
        model: 'keplerian-elements (osculating at J2000)',
        source: { dataset: H, release: r.targetSource, record: `COMMAND=${b?.command} ELEMENTS at JD ${J2000_JD}`, retrieved: hAt },
      });
    }
    rows.sort((x, y) => x.subject.localeCompare(y.subject));
    f.files.push({ path: `${ctx.curatedDir}/elements.json`, text: json(rows), sources: [E, H] });
    f.report = { tracks: rows.map((r) => `${r.subject}: ${r.model}`) };
    return f;
  },
};
