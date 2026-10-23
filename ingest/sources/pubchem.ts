// PubChem PUG REST (research R7): water, CID 962, as its 3D conformer record and its 2D record; the
// periodic table for the atom types hydrogen and oxygen. Raw kept; the exact URLs recorded. The
// citation is copied from PubChem's citation guidelines, read from the markdown its docs page
// renders (the page itself is behind a browser check), and the terms from NCBI's website policies.
import { readText } from '../lib/files';
import { keepTermsPage, pageText } from '../lib/terms';
import type { Acquired, SourceModule } from '../lib/types';
import { writeBytes } from '../lib/files';

export const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
export const CID = 962;
export const URLS = {
  conformer: `${BASE}/compound/cid/${CID}/record/JSON?record_type=3d`,
  record: `${BASE}/compound/cid/${CID}/record/JSON`,
  periodicTable: `${BASE}/periodictable/JSON`,
} as const;
export const RAW = { conformer: `cid-${CID}-3d.json`, record: `cid-${CID}.json`, periodicTable: 'periodic-table.json' } as const;
export const CITATION_MD = 'https://pubchem.ncbi.nlm.nih.gov/pcfe/docs/markdown/citation-guidelines.md';
export const CITATION_PAGE = 'https://pubchem.ncbi.nlm.nih.gov/docs/citation-guidelines';
export const POLICIES = 'https://www.ncbi.nlm.nih.gov/home/about/policies/';
export const RECORD_URL = `https://pubchem.ncbi.nlm.nih.gov/compound/${CID}`;

/** Markdown to the plain sentence it shows: links to their text, emphasis removed. */
const plain = (md: string) => md.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[_*]/g, '').replace(/\s+/g, ' ').trim();

export const pubchem: SourceModule = {
  name: 'pubchem',
  async acquire({ rawDir, http }): Promise<Acquired> {
    const raw: string[] = [];
    for (const k of ['conformer', 'record', 'periodicTable'] as const) {
      const path = `${rawDir}/${RAW[k]}`;
      await writeBytes(path, await http.get(URLS[k]));
      raw.push(path);
    }
    const md = await keepTermsPage(http, rawDir, 'citation-guidelines.md', CITATION_MD);
    const policies = await keepTermsPage(http, rawDir, 'ncbi-policies.html', POLICIES);
    raw.push(md, policies);
    const mdText = await readText(md);
    const updated = mdText.match(/^\*Last updated: ([^*]+)\*/)?.[1];
    const ama = mdText.match(/### AMA\s*\n>>\s*\n>>(Kim S[^\n]+)/)?.[1];
    if (!ama || !updated) throw new Error(`PubChem's citation guidelines did not give the primary citation (${CITATION_MD})`);
    const pol = pageText(await readText(policies));
    const terms = pol.match(/Information that is created by or for the US government on this site is within the public domain\. Public domain information on the National Library of Medicine \(NLM\) Web pages may be freely distributed and copied\. However, it is requested that in any subsequent use of this work, NLM be given appropriate acknowledgment\./)?.[0];
    if (!terms) throw new Error(`NCBI's website policies did not state the copyright status (${POLICIES})`);
    return {
      query: { ...URLS, rateLimit: 'under five requests per second' },
      source_release: `PubChem, not numbered; the records as retrieved (citation guidelines last updated ${updated})`,
      licence: `PubChem states no licence of its own. NCBI's website policies: "${terms}" (${POLICIES})`,
      attribution: `PubChem Identifier: CID ${CID}. URL: ${RECORD_URL}`,
      citation: [plain(ama)],
      terms_pages: [CITATION_PAGE, CITATION_MD, POLICIES],
      raw,
    };
  },
};
