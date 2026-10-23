// The Solar System's entities: names and catalogue ids from the Horizons records, kinds per Q5,
// `orbits` and `satelliteOf` with the body's sampled states as evidence, and the mean radius and mass
// rows transcribed from the NSSDCA fact sheets. A page with no "Volumetric mean radius (km)" row
// gives a null radius, cited; no radius is computed from diameters (research R5).
import { IDS } from '../../app/src/model/ids';
import type { Entity, Observation, SourceRecord } from '../../app/src/model/schema';
import { emptyFragment } from '../lib/types';
import { BODIES } from '../sources/horizons';
import { PAGES, pageUrl } from '../sources/nssdca-factsheet';
import { idOf } from './ephemeris';
import type { Curator } from './index';
import { parseHorizons } from './horizons-parse';
import { htmlText, rawFiles, readRaw, retrieved } from './raw';

const H = 'jpl-horizons';
const N = 'nssdca-factsheet';

const KIND: Record<string, Entity['kind']> = {
  mercury: 'Planet', venus: 'Planet', earth: 'Planet', mars: 'Planet', jupiter: 'Planet', saturn: 'Planet', uranus: 'Planet', neptune: 'Planet',
  moon: 'Moon', ceres: 'SmallBody', pluto: 'SmallBody', halley: 'SmallBody',
};

/** Canonical name and aliases from the Horizons target name: "1 Ceres (A801 AA)" is Ceres, also "1 Ceres" and "A801 AA". */
export const namesFromHorizons = (target: string): { canonical: string; aliases: string[] } => {
  const m = target.match(/^(.*?)\s*\((.*)\)$/);
  const main = (m ? m[1] : target)?.trim() ?? target;
  const paren = m?.[2]?.trim();
  const comet = main.match(/^(\d+P)\/(.+)$/);
  if (comet) return { canonical: main, aliases: [comet[2] as string, comet[1] as string] };
  const numbered = main.match(/^\d+\s+(.+)$/);
  const canonical = numbered?.[1] ?? main;
  const aliases = [numbered ? main : null, paren && !/^\d+$/.test(paren) ? paren : null].filter((x): x is string => !!x);
  return { canonical, aliases };
};

const num = (s: string) => Number(s.replace(/,/g, ''));
/** "5.6832" at 10^26 as the number 5.6832e26, without the rounding a multiplication brings. */
const scaled = (mantissa: string, exponent: number | string) => Number(`${mantissa.replace(/,/g, '').replace(/\.$/, '')}e${exponent}`);

export interface FactRow { value: number | null; label: string }

export const readFactSheet = (html: string, slug: string): { radius: FactRow; mass: FactRow; updated: string } => {
  const t = htmlText(html);
  const updated = html.match(/Last Updated:\s*([^<,]+)/i)?.[1]?.trim() ?? 'page not dated';
  if (slug === 'ceres') {
    const row = t.match(/1\s+Ceres\s+(\d+\s*x\s*\d+\s*x\s*\d+)\s+([\d,]+)\s/);
    return { radius: { value: null, label: `Diameter (km) "${row?.[1] ?? ''}", three axes; no mean radius` }, mass: { value: row?.[2] ? scaled(row[2], 15) : null, label: '~Mass (10^15 kg)' }, updated };
  }
  if (slug === 'halley') return { radius: { value: null, label: 'no radius row for Halley' }, mass: { value: null, label: 'no mass row for Halley' }, updated };
  const r = t.match(/Volumetric mean radius \(km\)\s+([\d,]+\.?\d*)/);
  const m = t.match(/Mass \(10(\d+) kg\)\s+([\d,]+\.?\d*)/);
  return {
    radius: { value: r?.[1] ? num(r[1]) : null, label: 'Volumetric mean radius (km)' },
    mass: { value: m?.[1] && m[2] ? scaled(m[2], m[1]) : null, label: m ? `Mass (10^${m[1]} kg)` : 'no mass row' },
    updated,
  };
};

export const solarSystemCurator: Curator = {
  name: 'solar-system',
  needs: [H, N],
  async run(ctx) {
    const f = emptyFragment();
    const hAt = retrieved(ctx.manifest, H);
    const nAt = retrieved(ctx.manifest, N);
    const missing: string[] = [];
    const facts = async (slug: string) => {
      const file = PAGES[slug] as string;
      const page = rawFiles(ctx.manifest, N).find((p) => p.endsWith(`/${file}`));
      if (!page) throw new Error(`no raw page ${file}`);
      return { file, ...readFactSheet(await readRaw(page), slug) };
    };
    const observe = (subject: string, slug: string, fs: Awaited<ReturnType<typeof facts>>) => {
      for (const [property, row, unit] of [['meanRadius', fs.radius, 'km'], ['mass', fs.mass, 'kg']] as const) {
        const source: SourceRecord = { dataset: N, release: `${fs.file}, last updated ${fs.updated}`, record: `${pageUrl(fs.file)} "${row.label}"`, retrieved: nAt };
        const o: Observation = { id: `obs:nssdca:${slug}:${property}`, subject, property, value: row.value, unit, source };
        f.observations.push(o);
        f.rawValues.push({ subject, property, value: row.value });
        if (row.value === null) missing.push(`${subject} ${property}: ${row.label} (${pageUrl(fs.file)})`);
      }
    };

    const sunFacts = await facts('sun');
    f.entities.push({
      id: IDS.sun, kind: 'Star',
      names: { canonical: 'Sun', aliases: [], catalogue: [{ catalogue: 'horizons', id: '10' }], source: { dataset: N, release: `sunfact.html, last updated ${sunFacts.updated}`, record: pageUrl('sunfact.html'), retrieved: nAt } },
      classifications: [], relations: [], evidence: [],
    });
    observe(IDS.sun, 'sun', sunFacts);

    for (const b of BODIES) {
      const id = idOf(b.slug);
      const first = rawFiles(ctx.manifest, H, 'vectors/').find((p) => p.split('/').pop()?.startsWith(`${b.slug}-`));
      if (!first) throw new Error(`no Horizons vectors for ${b.slug}`);
      const r = parseHorizons(await readRaw(first));
      const names = namesFromHorizons(r.target);
      const evidence = [`obs:horizons:${b.slug}:state-vectors`];
      const relation = b.slug === 'moon'
        ? { source: id, predicate: 'satelliteOf' as const, target: IDS.earth, status: 'derived' as const, evidence }
        : { source: id, predicate: 'orbits' as const, target: IDS.sun, status: 'derived' as const, evidence };
      f.entities.push({
        id, kind: KIND[b.slug] as Entity['kind'],
        names: { ...names, catalogue: [{ catalogue: 'horizons', id: b.command.replace(/;$/, '') }], source: { dataset: H, release: r.targetSource, record: `Target body name: ${r.target}`, retrieved: hAt } },
        classifications: [], relations: [relation], evidence,
      });
      observe(id, b.slug, await facts(b.slug));
    }
    f.report = { entities: f.entities.length, missingValues: missing };
    return f;
  },
};
