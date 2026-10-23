// Derived states and the model aggregate. A derived state is computed from observations and a named
// model and names both; it is never stored as if it were an observation.
import type { Entities } from './entities';
import type { AtlasId } from './ids';
import type { Observations } from './observations';
import type {
  Attribution, Conformer, CrossMatch, Elements, EphemerisFile, Manifest, Precision, StarSample, Uncertainty,
} from './schema';
import type { Quantity, Unit } from './units';

export type ModelName = 'hermite-state-vectors' | 'inverse-parallax' | 'keplerian-elements' | 'icrs-to-ecliptic' | 'gaia-astrometry-to-position';

export interface DerivedState<T> {
  readonly subject: AtlasId;
  readonly property: 'position' | 'distance' | 'orbitTrack';
  readonly value: T;
  readonly status: 'derived';
  readonly model: { readonly name: ModelName; readonly version: string };
  readonly from: readonly string[];
  readonly uncertainty?: Uncertainty;
  readonly precision?: Quantity<Unit>;
}

export interface ReleaseInfo {
  readonly name: string;
  readonly manifest: Manifest;
  readonly reproducible: boolean;
  readonly testRelease: boolean;
  readonly window: { readonly from: string; readonly to: string };
}

export interface Model {
  readonly release: ReleaseInfo;
  readonly entities: Entities;
  readonly observations: Observations;
  readonly ephemerides: ReadonlyMap<string, EphemerisFile>;
  readonly elements: readonly Elements[];
  readonly stars: { readonly sample: StarSample; readonly crossMatches: readonly CrossMatch[] } | null;
  readonly molecules: readonly Conformer[];
  readonly precision: ReadonlyMap<string, Precision>;
  readonly attribution: readonly Attribution[];
}
