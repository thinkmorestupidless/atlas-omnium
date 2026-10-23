// The star sample: a Star per Gaia DR3 row with its observations and SIMBAD names; the sources the
// cuts removed, named; and, for every Hipparcos-2 star within 10 pc that Gaia lacks, a Star entered
// through a cross-match record. Gaia "lacks" a star only when all of these hold, each recorded: it
// is not in the sample, its HIP number has no row in gaiadr3.hipparcos2_best_neighbour, SIMBAD lists
// no Gaia DR3 identifier for it, and no Gaia DR3 source within 10 pc, before or after the cuts, lies
// within 5″ of its position carried to J2016.0 by its proper motion (FR-008a, research R4). A
// Hipparcos entry for a whole system whose components Gaia has, and the cuts removed, stays out.
import { gaiaStarId, hipStarId } from '../../app/src/model/ids';
import type { CrossMatch, Entity, Observation, Property, SourceRecord, StarSample } from '../../app/src/model/schema';
import { json } from '../lib/files';
import { numOrNull, parseCsv } from '../lib/tap';
import { emptyFragment, type Fragment } from '../lib/types';
import { ADQL, CRITERIA, RAW as GAIA_RAW } from '../sources/gaia';
import { RAW as HIP_RAW } from '../sources/hipparcos2';
import type { Curator } from './index';
import { rawFiles, readRaw, retrieved, sourceOf } from './raw';
import { starNames } from './star-names';

export const GAIA_EPOCH = { scale: 'TCB', jd: 2457389.0 } as const; // J2016.0
export const HIP_EPOCH = { scale: 'TT', jd: 2448349.0625 } as const; // J1991.25
const POSITION_MATCH_ARCSEC = 5;
const DEG = Math.PI / 180;

const sepArcsec = (ra1: number, de1: number, ra2: number, de2: number) => {
  const a = Math.sin(((de2 - de1) * DEG) / 2) ** 2 + Math.cos(de1 * DEG) * Math.cos(de2 * DEG) * Math.sin(((ra2 - ra1) * DEG) / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(a)))) / DEG * 3600;
};

interface Simbad { main: Map<string, string>; idents: Map<string, string[]>; release: string; at: string }

const readSimbad = async (ctx: Parameters<Curator['run']>[0]): Promise<Simbad> => {
  const main = new Map<string, string>();
  const idents = new Map<string, string[]>();
  for (const f of rawFiles(ctx.manifest, 'simbad').filter((p) => /\/main-\d+\.csv$/.test(p))) for (const r of parseCsv(await readRaw(f))) main.set(r.asked as string, r.main_id as string);
  for (const f of rawFiles(ctx.manifest, 'simbad').filter((p) => /\/idents-\d+\.csv$/.test(p))) {
    for (const r of parseCsv(await readRaw(f))) {
      const l = idents.get(r.asked as string) ?? [];
      l.push(r.ident as string);
      idents.set(r.asked as string, l);
    }
  }
  for (const l of idents.values()) l.sort();
  return { main, idents, release: String(sourceOf(ctx.manifest, 'simbad').source_release), at: retrieved(ctx.manifest, 'simbad') };
};

export const starsCurator: Curator = {
  name: 'stars',
  needs: ['gaia', 'hipparcos2', 'simbad'],
  async run(ctx) {
    const f: Fragment = emptyFragment();
    const gAt = retrieved(ctx.manifest, 'gaia');
    const hAt = retrieved(ctx.manifest, 'hipparcos2');
    const sim = await readSimbad(ctx);
    const gaiaFile = (name: string) => rawFiles(ctx.manifest, 'gaia').find((p) => p.endsWith(`/${name}`)) as string;
    const sample = parseCsv(await readRaw(gaiaFile(GAIA_RAW.sample))).sort((a, b) => (a.source_id as string).localeCompare(b.source_id as string));
    const uncut = parseCsv(await readRaw(gaiaFile(GAIA_RAW.uncut)));
    const bestNeighbour = new Map(parseCsv(await readRaw(gaiaFile(GAIA_RAW.bestNeighbour))).map((r) => [r.original_ext_source_id as string, r.source_id as string]));
    const hip = parseCsv(await readRaw(rawFiles(ctx.manifest, 'hipparcos2').find((p) => p.endsWith(`/${HIP_RAW}`)) as string)).sort((a, b) => Number(a.HIP) - Number(b.HIP));
    const inSample = new Set(sample.map((r) => r.source_id as string));
    const inUncut = new Set(uncut.map((r) => r.source_id as string));

    const simbadRecord = (asked: string): SourceRecord | null => {
      const main = sim.main.get(asked);
      return main ? { dataset: 'simbad', release: sim.release, record: `${main} (identifier ${asked})`, retrieved: sim.at } : null;
    };
    const names = (asked: string, fallback: string, fallbackSource: SourceRecord) => {
      const main = sim.main.get(asked);
      if (!main) return { canonical: fallback, aliases: [] as string[], source: fallbackSource };
      return { ...starNames(main, sim.idents.get(asked) ?? []), source: simbadRecord(asked) as SourceRecord };
    };
    const observe = (subject: string, prefix: string, property: Property, value: number | null, unit: Observation['unit'], source: SourceRecord, extra: Partial<Observation> = {}) => {
      const o: Observation = { id: `obs:${prefix}:${property}`, subject, property, value, unit, source, ...extra };
      if (value === null) { delete o.uncertainty; delete o.epoch; }
      f.observations.push(o);
      f.rawValues.push({ subject, property, value });
    };
    const sigma = (s: string | undefined) => { const v = numOrNull(s); return v === null ? {} : { uncertainty: { kind: 'stddev' as const, sigma: v } }; };

    const members: string[] = [];
    for (const r of sample) {
      const sid = r.source_id as string;
      const id = gaiaStarId(sid);
      const src: SourceRecord = { dataset: 'gaia', release: 'Gaia DR3', record: `source_id ${sid}`, retrieved: gAt };
      const asked = `Gaia DR3 ${sid}`;
      const n = names(asked, asked, src);
      const prefix = `gaia:${sid}`;
      const ep = { epoch: GAIA_EPOCH };
      observe(id, prefix, 'parallax', numOrNull(r.parallax), 'mas', src, { ...sigma(r.parallax_error), ...ep });
      observe(id, prefix, 'ra', numOrNull(r.ra), 'deg', src, ep);
      observe(id, prefix, 'dec', numOrNull(r.dec), 'deg', src, ep);
      observe(id, prefix, 'pmra', numOrNull(r.pmra), 'mas/yr', src, { ...sigma(r.pmra_error), ...ep });
      observe(id, prefix, 'pmdec', numOrNull(r.pmdec), 'mas/yr', src, { ...sigma(r.pmdec_error), ...ep });
      observe(id, prefix, 'radialVelocity', numOrNull(r.radial_velocity), 'km/s', src, { ...sigma(r.radial_velocity_error), ...ep });
      observe(id, prefix, 'gMagnitude', numOrNull(r.phot_g_mean_mag), 'mag', src);
      observe(id, prefix, 'bpRp', numOrNull(r.bp_rp), 'mag', src);
      observe(id, prefix, 'ruwe', numOrNull(r.ruwe), 'dimensionless', src);
      f.entities.push({
        id, kind: 'Star', names: { canonical: n.canonical, aliases: n.aliases, catalogue: [{ catalogue: 'gaia-dr3', id: sid }, ...(sim.main.get(asked) ? [{ catalogue: 'simbad' as const, id: sim.main.get(asked) as string }] : [])], source: n.source },
        classifications: [], relations: [], evidence: [`obs:${prefix}:parallax`],
      } satisfies Entity);
      members.push(id);
    }

    const removedByCuts: StarSample['removedByCuts'] = uncut.filter((r) => !inSample.has(r.source_id as string)).map((r) => {
      const failed: string[] = [];
      const poe = numOrNull(r.parallax_over_error);
      const ruwe = numOrNull(r.ruwe);
      if (poe === null || !(poe > CRITERIA.parallaxOverErrorGt)) failed.push(`parallax_over_error > ${CRITERIA.parallaxOverErrorGt}${poe === null ? ' (none given)' : ''}`);
      if (ruwe === null || !(ruwe < CRITERIA.ruweLt)) failed.push(`ruwe < ${CRITERIA.ruweLt}${ruwe === null ? ' (none given)' : ''}`);
      const main = sim.main.get(`Gaia DR3 ${r.source_id}`);
      return { sourceId: r.source_id as string, name: main ? starNames(main, sim.idents.get(`Gaia DR3 ${r.source_id}`) ?? []).canonical : null, failed };
    }).sort((a, b) => a.sourceId.localeCompare(b.sourceId));

    const crossMatches: CrossMatch[] = [];
    const hipDecisions: { hip: string; name: string | null; decision: string }[] = [];
    for (const h of hip) {
      const n = h.HIP as string;
      const asked = `HIP ${n}`;
      const main = sim.main.get(asked) ?? null;
      const label = main ? starNames(main, sim.idents.get(asked) ?? []).canonical : null;
      const bn = bestNeighbour.get(n);
      const simGaia = (sim.idents.get(asked) ?? []).find((i) => i.startsWith('Gaia DR3 '))?.slice(9);
      const decide = (decision: string) => hipDecisions.push({ hip: n, name: label, decision });
      if (bn) { decide(`Gaia DR3 ${bn} by gaiadr3.hipparcos2_best_neighbour: ${inSample.has(bn) ? 'in the sample' : inUncut.has(bn) ? 'removed by the cuts' : 'not within 10 pc by its Gaia parallax'}`); continue; }
      if (simGaia) { decide(`Gaia DR3 ${simGaia} by SIMBAD: ${inSample.has(simGaia) ? 'in the sample' : inUncut.has(simGaia) ? 'removed by the cuts' : 'not within 10 pc by its Gaia parallax'}`); continue; }
      const years = (GAIA_EPOCH.jd - HIP_EPOCH.jd) / 365.25;
      const ra = Number(h.RArad) + ((Number(h.pmRA) / 3.6e6) * years) / Math.cos(Number(h.DErad) * DEG);
      const de = Number(h.DErad) + (Number(h.pmDE) / 3.6e6) * years;
      const near = uncut.find((g) => sepArcsec(ra, de, Number(g.ra), Number(g.dec)) < POSITION_MATCH_ARCSEC);
      if (near) { decide(`Gaia DR3 ${near.source_id} within ${POSITION_MATCH_ARCSEC}″ of its position at J2016.0, SIMBAD not linking them: ${inSample.has(near.source_id as string) ? 'in the sample; not entered twice' : 'removed by the cuts; not entered past them'}`); continue; }
      const sim2 = simbadRecord(asked);
      if (!sim2) { decide('no SIMBAD record for the HIP number, so no cross-match record can be made; not entered'); continue; }
      const id = hipStarId(n);
      const src: SourceRecord = { dataset: 'hipparcos2', release: 'I/311', record: `HIP ${n}`, retrieved: hAt };
      const prefix = `hip:${n}`;
      const ep = { epoch: HIP_EPOCH };
      observe(id, prefix, 'parallax', numOrNull(h.Plx), 'mas', src, { ...sigma(h.e_Plx), ...ep });
      observe(id, prefix, 'ra', numOrNull(h.RArad), 'deg', src, ep);
      observe(id, prefix, 'dec', numOrNull(h.DErad), 'deg', src, ep);
      observe(id, prefix, 'pmra', numOrNull(h.pmRA), 'mas/yr', src, { ...sigma(h.e_pmRA), ...ep });
      observe(id, prefix, 'pmdec', numOrNull(h.pmDE), 'mas/yr', src, { ...sigma(h.e_pmDE), ...ep });
      observe(id, prefix, 'hpMagnitude', numOrNull(h.Hpmag), 'mag', src);
      const nm = names(asked, asked, src);
      f.entities.push({
        id, kind: 'Star', names: { canonical: nm.canonical, aliases: nm.aliases, catalogue: [{ catalogue: 'hip', id: n }, { catalogue: 'simbad', id: main as string }], source: nm.source },
        classifications: [], relations: [], evidence: [`obs:${prefix}:parallax`],
      });
      members.push(id);
      crossMatches.push({
        entity: id, records: [src, sim2], basis: 'published-cross-identification', gaiaDr3: null,
        absenceChecked: `not in the Gaia DR3 sample; HIP ${n} has no row in gaiadr3.hipparcos2_best_neighbour; SIMBAD lists no Gaia DR3 identifier for it; no Gaia DR3 source within 10 pc, before or after the cuts, within ${POSITION_MATCH_ARCSEC}″ of its position at J2016.0`,
      });
      decide('Gaia DR3 lacks it: entered through a cross-match record (published-cross-identification)');
    }

    const starSample: StarSample = { release: 'gaia-dr3', criteria: { ...CRITERIA }, query: ADQL, members: members.sort(), removedByCuts };
    f.files.push({ path: `${ctx.curatedDir}/stars.json`, text: json({ sample: starSample, crossMatches }), sources: ['gaia', 'hipparcos2', 'simbad'] });
    const proxima = gaiaStarId('5853498713190525696');
    f.report = {
      gaiaRows: sample.length,
      withinTenParsecBeforeCuts: uncut.length,
      proximaCentauri: members.includes(proxima) ? 'present' : 'ABSENT',
      removedByCuts: removedByCuts.map((r) => `${r.sourceId}${r.name ? ` (${r.name})` : ''}: fails ${r.failed.join(' and ')}`),
      crossMatched: crossMatches.map((c) => `${c.entity} ${f.entities.find((e) => e.id === c.entity)?.names.canonical}: ${c.basis}`),
      hipparcos2Decisions: hipDecisions.filter((d) => !d.decision.includes('in the sample')).map((d) => `HIP ${d.hip}${d.name ? ` (${d.name})` : ''}: ${d.decision}`),
      unnamed: f.entities.filter((e) => e.names.source.dataset !== 'simbad').map((e) => e.id),
    };
    return f;
  },
};
