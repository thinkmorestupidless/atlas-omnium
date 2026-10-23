// JPL Horizons: state vectors for the Solar System bodies of 001, sampled on a grid per body over a
// span that brackets the supported window; held-out samples at grid midpoints, which the release
// never contains, to measure the interpolation against; osculating elements at J2000 for the small
// bodies' orbit tracks (research R1, R6).
import { writeBytes } from '../lib/files';
import { keepTermsPage } from '../lib/terms';
import type { Acquired, SourceModule } from '../lib/types';

export const ENDPOINT = 'https://ssd.jpl.nasa.gov/api/horizons.api';
export const API_VERSIONS = ['1.2', '1.3'];

export interface Body { slug: string; command: string; center: '500@10' | '500@399'; stepDays: number; name: string }

/**
 * Steps chosen so the cubic Hermite error is under 100 km (10 km for the Moon). Two motions bound
 * it: the orbit at perihelion (research R1) and, for a planet with massive moons, its centre's
 * motion about its system barycentre, which a coarse step cannot follow and whose velocity makes
 * Hermite overshoot (Io for Jupiter, Titan for Saturn, Titania for Uranus, Triton for Neptune,
 * Charon for Pluto: about 2,100 km every 6.4 days). Found during implementation.
 */
export const BODIES: readonly Body[] = [
  { slug: 'mercury', command: '199', center: '500@10', stepDays: 1, name: 'Mercury' },
  { slug: 'venus', command: '299', center: '500@10', stepDays: 4, name: 'Venus' },
  { slug: 'earth', command: '399', center: '500@10', stepDays: 4, name: 'Earth' },
  { slug: 'mars', command: '499', center: '500@10', stepDays: 8, name: 'Mars' },
  { slug: 'jupiter', command: '599', center: '500@10', stepDays: 1, name: 'Jupiter' },
  { slug: 'saturn', command: '699', center: '500@10', stepDays: 4, name: 'Saturn' },
  { slug: 'uranus', command: '799', center: '500@10', stepDays: 4, name: 'Uranus' },
  { slug: 'neptune', command: '899', center: '500@10', stepDays: 2, name: 'Neptune' },
  { slug: 'moon', command: '301', center: '500@399', stepDays: 1, name: 'Moon' },
  { slug: 'ceres', command: '1;', center: '500@10', stepDays: 16, name: 'Ceres' },
  { slug: 'pluto', command: '999', center: '500@10', stepDays: 2, name: 'Pluto' },
  { slug: 'halley', command: 'DES=1P;CAP;', center: '500@10', stepDays: 2, name: '1P/Halley' },
];
export const ELEMENT_BODIES = ['ceres', 'pluto', 'halley'] as const;

/** The sampled span: the window 2000-01-01 to 2050-12-31 widened by more than the longest step. */
export const SPAN = { startJd: 2451483.5 /* 1999-11-01 */, stopJd: 2470257.5 /* 2051-03-01 */ };
export const WINDOW = { from: '2000-01-01', to: '2050-12-31', fromJd: 2451544.5, toJd: 2469807.5 };
/** Rows per request: about five years of a one-day grid. */
const ROWS_PER_CHUNK = 1830;
/** Every 97th grid interval contributes a held-out epoch at its midpoint, closer for a body with few
 * intervals so that every body is checked at no fewer than 50 epochs across the window. */
export const HELD_OUT_EVERY = 97;
export const HELD_OUT_MIN = 50;
export const heldOutStride = (b: Body): number =>
  Math.max(1, Math.min(HELD_OUT_EVERY, Math.floor((WINDOW.toJd - WINDOW.fromJd) / b.stepDays / HELD_OUT_MIN)));
export const J2000_JD = 2451545.0;
/** Held-out epochs per request; a longer TLIST makes Horizons answer 502. */
const HELD_OUT_BATCH = 40;

const common = { format: 'json', OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', REF_PLANE: 'ECLIPTIC', REF_SYSTEM: 'ICRF', TIME_TYPE: 'TDB', CSV_FORMAT: 'YES' };
const vectors = { ...common, EPHEM_TYPE: 'VECTORS', VEC_TABLE: '2', OUT_UNITS: 'KM-S', VEC_LABELS: 'NO' };

const url = (params: Record<string, string>): string =>
  `${ENDPOINT}?${Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(k === 'format' ? v : `'${v}'`)}`).join('&')}`;

export const chunks = (b: Body): { startJd: number; stopJd: number }[] => {
  const span = ROWS_PER_CHUNK * b.stepDays;
  const out: { startJd: number; stopJd: number }[] = [];
  for (let s = SPAN.startJd; s < SPAN.stopJd; s += span) out.push({ startJd: s, stopJd: Math.min(s + span, SPAN.stopJd) });
  return out;
};

/**
 * Epochs held out for every body at once, so a scenario can check every body at one date. A quarter
 * day off the half-day grid of every body, so none of them is a sample.
 */
export const SHARED_HELD_OUT = [2461000.25, 2466000.75] as const;

/** Held-out epochs: midpoints of every 97th grid interval inside the window, never grid samples, and the shared ones. */
export const heldOutEpochs = (b: Body): number[] => {
  const out: number[] = [...SHARED_HELD_OUT];
  for (let k = 0; ; k += heldOutStride(b)) {
    const jd = SPAN.startJd + (k + 0.5) * b.stepDays;
    if (jd > WINDOW.toJd) break;
    if (jd >= WINDOW.fromJd) out.push(jd);
  }
  return out.sort((x, y) => x - y);
};

export const queries = () => ({
  vectors,
  grid: Object.fromEntries(BODIES.map((b) => [b.slug, { COMMAND: b.command, CENTER: b.center, STEP_SIZE: `${b.stepDays} d`, span: SPAN, chunks: chunks(b).length }])),
  heldOut: { every: Object.fromEntries(BODIES.map((b) => [b.slug, heldOutStride(b)])), at: 'grid-interval midpoints, never grid samples', shared: [...SHARED_HELD_OUT], center: 'as the body\'s grid' },
  elements: { ...common, EPHEM_TYPE: 'ELEMENTS', OUT_UNITS: 'AU-D', CENTER: '500@10', TLIST: String(J2000_JD), bodies: ELEMENT_BODIES },
});

export const horizons: SourceModule = {
  name: 'jpl-horizons',
  async acquire({ rawDir, http }): Promise<Acquired> {
    const raw: string[] = [];
    const keep = async (path: string, u: string) => {
      const bytes = await http.get(u);
      const body = JSON.parse(new TextDecoder().decode(bytes)) as { signature?: { version?: string }; error?: string };
      if (body.error) throw new Error(`Horizons refused ${u}: ${body.error}`);
      if (!API_VERSIONS.includes(body.signature?.version ?? '')) throw new Error(`Horizons API version ${body.signature?.version} is not one ingest was written against`);
      await writeBytes(path, bytes);
      raw.push(path);
      return body.signature?.version ?? '';
    };
    let version = '';
    for (const b of BODIES) {
      for (const c of chunks(b)) {
        version = await keep(`${rawDir}/vectors/${b.slug}-${c.startJd}.json`, url({ ...vectors, COMMAND: b.command, CENTER: b.center, START_TIME: `JD${c.startJd}`, STOP_TIME: `JD${c.stopJd}`, STEP_SIZE: `${b.stepDays} d` }));
      }
      const epochs = heldOutEpochs(b);
      for (let k = 0; k < epochs.length; k += HELD_OUT_BATCH) {
        const tlist = epochs.slice(k, k + HELD_OUT_BATCH).map((j) => j.toFixed(6)).join(' ');
        await keep(`${rawDir}/held-out/${b.slug}-${String(k / HELD_OUT_BATCH).padStart(2, '0')}.json`, url({ ...vectors, COMMAND: b.command, CENTER: b.center, TLIST_TYPE: 'JD', TLIST: tlist }));
      }
      console.log(`  ${b.slug}: ${chunks(b).length} chunks, ${heldOutEpochs(b).length} held-out epochs`);
    }
    for (const slug of ELEMENT_BODIES) {
      const b = BODIES.find((x) => x.slug === slug) as Body;
      await keep(`${rawDir}/elements/${slug}.json`, url({ ...common, EPHEM_TYPE: 'ELEMENTS', OUT_UNITS: 'AU-D', CENTER: '500@10', COMMAND: b.command, TLIST_TYPE: 'JD', TLIST: String(J2000_JD) }));
    }
    raw.push(await keepTermsPage(http, rawDir, 'ssd-about.html', 'https://ssd.jpl.nasa.gov/about/'));
    return {
      query: queries(),
      source_release: 'per body, as each response header names it: DE441 for the planets and the Moon, the satellite or small-body solution for the target (see the curated files)',
      api_version: version,
      licence: 'No licence stated. "For referencing the data downloaded from the SSD website, please use the following citation" (https://ssd.jpl.nasa.gov/about/).',
      attribution: 'Solar System Dynamics. (Downloaded 2026, October). (Horizons System). https://ssd.jpl.nasa.gov',
      citation: ['Solar System Dynamics. (Downloaded Year, Month, Date). (Title of the Page). https://ssd.jpl.nasa.gov'],
      terms_pages: ['https://ssd.jpl.nasa.gov/about/'],
      raw,
    };
  },
};
