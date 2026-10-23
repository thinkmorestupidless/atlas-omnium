// Gaia DR3: the star sample by the query of research R3, verbatim; every source within 10 pc before
// the cuts, so the stars the cuts removed are named; and the archive's Hipparcos-2 best neighbours
// for every Hipparcos-2 star within 10 pc, so an absence from Gaia is checked, not assumed.
import { readText } from '../lib/files';
import { parseCsv, tapQuery } from '../lib/tap';
import { keepTermsPage, pageText } from '../lib/terms';
import type { Acquired, SourceModule } from '../lib/types';
import { RAW as HIP_RAW } from './hipparcos2';

export const ENDPOINT = 'https://gea.esac.esa.int/tap-server/tap/sync';
export const ADQL = 'SELECT source_id, ra, dec, parallax, parallax_error, pmra, pmdec, pmra_error, pmdec_error, radial_velocity, radial_velocity_error, phot_g_mean_mag, bp_rp, ruwe, ref_epoch FROM gaiadr3.gaia_source WHERE parallax > 100 AND parallax_over_error > 10 AND ruwe < 1.4';
export const ADQL_UNCUT = 'SELECT source_id, ra, dec, parallax, parallax_over_error, ruwe FROM gaiadr3.gaia_source WHERE parallax > 100';
export const CRITERIA = { parallaxMasGt: 100, parallaxOverErrorGt: 10, ruweLt: 1.4 } as const;
export const LICENCE_PAGE = 'https://www.cosmos.esa.int/web/gaia-users/license';
export const CREDIT_PAGE = 'https://gea.esac.esa.int/archive/documentation/GDR3/Miscellaneous/sec_credit_and_citation_instructions/';
/** The Internet Archive's copy of the same page, read only when the archive's documentation server refuses. */
export const CREDIT_PAGE_ARCHIVED = `https://web.archive.org/web/20260211062935id_/${CREDIT_PAGE}`;
export const RAW = { sample: 'sample.csv', uncut: 'within-10pc-uncut.csv', bestNeighbour: 'hipparcos2-best-neighbour.csv' } as const;

export const bestNeighbourAdql = (hips: readonly string[]) =>
  `SELECT original_ext_source_id, source_id FROM gaiadr3.hipparcos2_best_neighbour WHERE original_ext_source_id IN (${hips.join(', ')})`;


export const gaia: SourceModule = {
  name: 'gaia',
  async acquire({ release, rawDir, http }): Promise<Acquired> {
    const hipText = await readText(`data/raw/${release}/hipparcos2/${HIP_RAW}`).catch(() => {
      throw new Error('gaia needs the Hipparcos-2 raw file first: acquire hipparcos2 before gaia');
    });
    const hips = parseCsv(hipText).map((r) => r.HIP as string).sort((a, b) => Number(a) - Number(b));
    const paths = { sample: `${rawDir}/${RAW.sample}`, uncut: `${rawDir}/${RAW.uncut}`, bestNeighbour: `${rawDir}/${RAW.bestNeighbour}` };
    await tapQuery(http, ENDPOINT, ADQL, paths.sample);
    await tapQuery(http, ENDPOINT, ADQL_UNCUT, paths.uncut);
    await tapQuery(http, ENDPOINT, bestNeighbourAdql(hips), paths.bestNeighbour);
    const licence = await keepTermsPage(http, rawDir, 'license.html', LICENCE_PAGE);
    let creditUrl = CREDIT_PAGE;
    const credit = await keepTermsPage(http, rawDir, 'credit-and-citation.html', CREDIT_PAGE).catch(async (e: Error) => {
      console.warn(`${e.message}; reading the Internet Archive's copy of the same page`);
      creditUrl = CREDIT_PAGE_ARCHIVED;
      return keepTermsPage(http, rawDir, 'credit-and-citation.html', CREDIT_PAGE_ARCHIVED);
    });
    const creditText = pageText(await readText(credit));
    const ack = creditText.match(/This work has made use of data from the European Space Agency \(ESA\) mission Gaia[\s\S]*?institutions participating in the Gaia Multilateral Agreement\./)?.[0]?.replace(/\( (https:\S+) \)/g, '($1)').replace(/(https:\S+) \)/g, '$1)');
    if (!ack) throw new Error(`the Gaia credit page did not give its acknowledgement (${CREDIT_PAGE}); not copying it from anywhere else`);
    const licenceText = pageText(await readText(licence));
    const licenceLine = licenceText.match(/Gaia data are distributed under the .+? license\./)?.[0]?.replace(/\s+license/, ' license');
    if (!licenceLine) throw new Error(`the Gaia licence page did not state the licence (${LICENCE_PAGE})`);
    const cite = [...creditText.matchAll(/Gaia Collaboration et al\. \( ?(2016b|2023j) ?\) ?: ([^;(]+)/g)].map((m) => `Gaia Collaboration et al. (${m[1]}): ${(m[2] as string).trim()}`);
    if (cite.length !== 2) throw new Error(`the Gaia credit page did not give the mission and DR3 papers to cite (${creditUrl})`);
    return {
      query: { adql: ADQL, uncut: ADQL_UNCUT, bestNeighbour: 'SELECT original_ext_source_id, source_id FROM gaiadr3.hipparcos2_best_neighbour WHERE original_ext_source_id IN (every HIP of the hipparcos2 source)', criteria: CRITERIA, format: 'csv' },
      source_release: 'Gaia DR3, reference epoch J2016.0 (TCB)',
      licence: `${licenceLine} (${LICENCE_PAGE})`,
      attribution: ack,
      citation: cite,
      terms_pages: [LICENCE_PAGE, creditUrl],
      raw: [paths.sample, paths.uncut, paths.bestNeighbour, licence, credit],
    };
  },
};
