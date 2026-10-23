// NSSDCA planetary fact sheets: one page per body, kept as fetched. Curation reads the "Volumetric
// mean radius (km)" and "Mass (10^n kg)" rows; a page that gives no mean radius gives none (research R5).
import { keepTermsPage } from '../lib/terms';
import { writeBytes } from '../lib/files';
import type { Acquired, SourceModule } from '../lib/types';

const BASE = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/';
export const PAGES: Record<string, string> = {
  sun: 'sunfact.html', mercury: 'mercuryfact.html', venus: 'venusfact.html', earth: 'earthfact.html', mars: 'marsfact.html',
  jupiter: 'jupiterfact.html', saturn: 'saturnfact.html', uranus: 'uranusfact.html', neptune: 'neptunefact.html',
  moon: 'moonfact.html', pluto: 'plutofact.html', ceres: 'asteroidfact.html', halley: 'cometfact.html',
};
export const pageUrl = (file: string) => `${BASE}${file}`;

export const nssdca: SourceModule = {
  name: 'nssdca-factsheet',
  async acquire({ rawDir, http }): Promise<Acquired> {
    const raw: string[] = [];
    for (const file of new Set(Object.values(PAGES))) {
      const path = `${rawDir}/${file}`;
      await writeBytes(path, await http.get(pageUrl(file)));
      raw.push(path);
    }
    raw.push(await keepTermsPage(http, rawDir, 'index.html', BASE));
    return {
      query: { pages: Object.fromEntries(Object.entries(PAGES).map(([k, f]) => [k, pageUrl(f)])), rows: ['Volumetric mean radius (km)', 'Mass (10^n kg)'] },
      source_release: 'the pages as retrieved; the index page reads "Last Updated: 18 March 2025, DRW"',
      licence: 'No licence stated; a NASA web page. The index page names "Author/Curator: Dr. David R. Williams, dave.williams@nasa.gov".',
      attribution: 'NASA Space Science Data Coordinated Archive, Planetary Fact Sheets. Author/Curator: Dr. David R. Williams.',
      citation: [],
      terms_pages: [BASE],
      raw,
    };
  },
};
