// The sources and curators of release 001-prototype, in the order they run. A curator runs when
// every source it needs has raw files.
import type { Curator } from './curate/index';
import { elementsCurator } from './curate/elements';
import { ephemerisCurator } from './curate/ephemeris';
import { precisionCurator } from './curate/precision';
import { solarSystemCurator } from './curate/solar-system';
import { moleculesCurator } from './curate/molecules';
import { starsCurator } from './curate/stars';
import type { SourceModule } from './lib/types';
import { gaia } from './sources/gaia';
import { hipparcos2 } from './sources/hipparcos2';
import { horizons } from './sources/horizons';
import { pubchem } from './sources/pubchem';
import { simbad } from './sources/simbad';
import { jplElements } from './sources/jpl-elements';
import { nssdca } from './sources/nssdca-factsheet';

export const SOURCES: Record<string, SourceModule> = {
  [horizons.name]: horizons,
  [nssdca.name]: nssdca,
  [jplElements.name]: jplElements,
  [hipparcos2.name]: hipparcos2,
  [gaia.name]: gaia,
  [simbad.name]: simbad,
  [pubchem.name]: pubchem,
};
export const CURATORS: Curator[] = [ephemerisCurator, precisionCurator, solarSystemCurator, elementsCurator, starsCurator, moleculesCurator];
