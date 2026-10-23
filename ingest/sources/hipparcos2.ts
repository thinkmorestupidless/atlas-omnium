// Hipparcos, the New Reduction (van Leeuwen 2007; VizieR I/311/hip2): every star with a parallax over
// 100 mas. Only those Gaia DR3 lacks enter the sample, through cross-match records (research R4).
import { tapQuery } from '../lib/tap';
import { keepTermsPage } from '../lib/terms';
import type { Acquired, SourceModule } from '../lib/types';

export const ENDPOINT = 'https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync';
export const ADQL = 'SELECT HIP, RArad, DErad, Plx, e_Plx, pmRA, pmDE, e_pmRA, e_pmDE, Hpmag FROM "I/311/hip2" WHERE Plx > 100';
export const RAW = 'hip2.csv';
export const TERMS = 'https://cds.unistra.fr/vizier-org/licences_vizier.html';

export const hipparcos2: SourceModule = {
  name: 'hipparcos2',
  async acquire({ rawDir, http }): Promise<Acquired> {
    const path = `${rawDir}/${RAW}`;
    await tapQuery(http, ENDPOINT, ADQL, path);
    return {
      query: { adql: ADQL, format: 'csv' },
      source_release: 'I/311 (Hipparcos, the New Reduction, van Leeuwen 2007), epoch J1991.25',
      licence: '"The data retrieved with VizieR are free of usage in a scientific context ; however, as it is the usage in scientific publication, the original authors and publication references including the publisher have to be explicitely cited" (https://cds.unistra.fr/vizier-org/licences_vizier.html).',
      attribution: 'This research has made use of the VizieR catalogue access tool, CDS, Strasbourg, France (DOI : 10.26093/cds/vizier). The original description of the VizieR service was published in 2000, A&AS 143, 23',
      citation: ['van Leeuwen F. 2007, A&A 474, 653, "Validation of the new Hipparcos reduction" (VizieR I/311)', 'Ochsenbein F. et al. 2000, A&AS 143, 23, "The VizieR database of astronomical catalogues"'],
      terms_pages: [TERMS],
      raw: [path, await keepTermsPage(http, rawDir, 'licences_vizier.html', TERMS)],
    };
  },
};
