// SIMBAD: the main identifier and the names of every star, and the identifiers that tie a Hipparcos
// number to a Gaia DR3 source, queried by Gaia DR3 source_id and by HIP number in batches.
import { readText } from '../lib/files';
import { parseCsv, tapQuery } from '../lib/tap';
import { keepTermsPage, pageText } from '../lib/terms';
import type { Acquired, SourceModule } from '../lib/types';
import { RAW as GAIA_RAW } from './gaia';
import { RAW as HIP_RAW } from './hipparcos2';

export const ENDPOINT = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
export const HOME = 'https://simbad.cds.unistra.fr/simbad/';
export const ACK_PAGE = 'https://cds.unistra.fr/help/acknowledgement/';
export const BATCH = 50;

const list = (ids: readonly string[]) => ids.map((i) => `'${i.replace(/'/g, "''")}'`).join(', ');
export const mainAdql = (ids: readonly string[]) =>
  `SELECT i.id AS asked, b.main_id FROM ident AS i JOIN basic AS b ON b.oid = i.oidref WHERE i.id IN (${list(ids)})`;
export const identsAdql = (ids: readonly string[]) =>
  `SELECT i.id AS asked, i2.id AS ident FROM ident AS i JOIN ident AS i2 ON i2.oidref = i.oidref WHERE i.id IN (${list(ids)}) AND (i2.id LIKE 'NAME %' OR i2.id LIKE 'Gaia DR3 %' OR i2.id LIKE '* %')`;


export const simbad: SourceModule = {
  name: 'simbad',
  async acquire({ release, rawDir, http }): Promise<Acquired> {
    const gaiaIds = parseCsv(await readText(`data/raw/${release}/gaia/${GAIA_RAW.uncut}`)).map((r) => `Gaia DR3 ${r.source_id}`);
    const hipIds = parseCsv(await readText(`data/raw/${release}/hipparcos2/${HIP_RAW}`)).map((r) => `HIP ${r.HIP}`);
    const ids = [...gaiaIds.sort(), ...hipIds.sort()];
    const raw: string[] = [];
    for (let k = 0; k < ids.length; k += BATCH) {
      const batch = ids.slice(k, k + BATCH);
      const n = String(k / BATCH).padStart(2, '0');
      await tapQuery(http, ENDPOINT, mainAdql(batch), `${rawDir}/main-${n}.csv`);
      await tapQuery(http, ENDPOINT, identsAdql(batch), `${rawDir}/idents-${n}.csv`);
      raw.push(`${rawDir}/main-${n}.csv`, `${rawDir}/idents-${n}.csv`);
    }
    const home = await keepTermsPage(http, rawDir, 'home.html', HOME);
    const ackPath = await keepTermsPage(http, rawDir, 'acknowledgement.html', ACK_PAGE);
    raw.push(home, ackPath);
    const homeText = pageText(await readText(home));
    const releaseName = homeText.match(/Release:\s*(SIMBAD4 [\d.]+ - \d{4}-\d{2})/)?.[1];
    if (!releaseName) throw new Error(`the SIMBAD home page did not name its release (${HOME})`);
    const licence = homeText.match(/Use of SIMBAD service is free without any registration under ODbL licence\. We request that users cite the original paper reference\./)?.[0];
    if (!licence) throw new Error(`the SIMBAD home page did not state its licence (${HOME})`);
    const ack = pageText(await readText(ackPath));
    const line = ack.match(/This research has made use of the SIMBAD database, CDS, Strasbourg Astronomical Observatory, France/)?.[0];
    const cite = ack.match(/2000, A&A ?S, 143, 9 ?, "The SIMBAD astronomical database", Wenger et al\./)?.[0]?.replace(' ,', ',');
    if (!line || !cite) throw new Error(`the CDS acknowledgement page did not give SIMBAD's acknowledgement (${ACK_PAGE})`);
    return {
      query: { main: mainAdql(['<id>', '...']), idents: identsAdql(['<id>', '...']), identifiers: 'every Gaia DR3 source within 10 pc before the cuts, and every Hipparcos-2 star with Plx > 100', batch: BATCH, format: 'csv' },
      source_release: releaseName,
      licence: `"${licence}" (${HOME})`,
      attribution: line,
      citation: [cite],
      terms_pages: [HOME, ACK_PAGE],
      raw,
    };
  },
};
