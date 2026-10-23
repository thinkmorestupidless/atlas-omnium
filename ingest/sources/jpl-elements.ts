// JPL's "Approximate Positions of the Planets", Table 1: Keplerian elements valid 1800 AD to 2050 AD,
// used only to draw orbit tracks, never as the authority for a position (decision 0004).
import { writeBytes } from '../lib/files';
import type { Acquired, SourceModule } from '../lib/types';

export const PAGE = 'https://ssd.jpl.nasa.gov/planets/approx_pos.html';

export const jplElements: SourceModule = {
  name: 'jpl-keplerian-elements',
  async acquire({ rawDir, http }): Promise<Acquired> {
    const path = `${rawDir}/approx_pos.html`;
    await writeBytes(path, await http.get(PAGE));
    return {
      query: { page: PAGE, table: 'Table 1: Keplerian elements and their rates, valid 1800 AD - 2050 AD; the J2000 values only' },
      source_release: 'Table 1, E M Standish, as published on the page retrieved',
      licence: 'No licence stated. "For referencing the data downloaded from the SSD website, please use the following citation" (https://ssd.jpl.nasa.gov/about/).',
      attribution: 'Solar System Dynamics. (Downloaded 2026, October). (Approximate Positions of the Planets). https://ssd.jpl.nasa.gov',
      citation: ['Solar System Dynamics. (Downloaded Year, Month, Date). (Title of the Page). https://ssd.jpl.nasa.gov'],
      terms_pages: ['https://ssd.jpl.nasa.gov/about/'],
      raw: [path],
    };
  },
};
