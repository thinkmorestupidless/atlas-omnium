# Data model: 001 earth

*2026-10-23.* The entities, observations, derived states and navigation state of 001, as the
code types them. `docs/data-contracts.md` is the general contract; this page is the 001 instance of
it and the validation rules the spec adds. Field names are the contract; the zod schemas in
`app/src/model/schema.ts` are generated from nothing and are the single source for both ingest and
the application.

## Identity

`AtlasId` is a branded string, `atlas:<slug>`. The release's ids, fixed now and never renamed:

| Entity | id | kind |
|---|---|---|
| the Sun | `atlas:sun` | `Star` |
| the planets | `atlas:mercury` … `atlas:neptune` | `Planet` |
| the Moon | `atlas:moon` | `Moon` |
| Ceres, Pluto, 1P/Halley | `atlas:ceres`, `atlas:pluto`, `atlas:halley` | `SmallBody` |
| a Gaia star | `atlas:gaia-dr3-<source_id>` | `Star` |
| a Hipparcos-only star | `atlas:hip-<HIP>` | `Star` |
| water | `atlas:water` | `Substance` |
| the water molecule type | `atlas:pubchem-962` | `MoleculeType` |
| hydrogen, oxygen | `atlas:element-h`, `atlas:element-o` | `AtomType` |

`Kind` in 001 is `'Star' | 'Planet' | 'Moon' | 'SmallBody' | 'Substance' | 'MoleculeType' | 'AtomType'`
(clarification Q5: the Sun is a `Star`; dwarf planets, asteroids and comets are `SmallBody`). The
type in `docs/data-contracts.md` also lists `StarSystem` and `DwarfPlanet`; neither is used in 001
and the schema rejects them until a release carries one.

## Entity

```ts
interface Entity {
  id: AtlasId;
  kind: Kind;
  names: { canonical: string; aliases: string[]; catalogue: CatalogueId[]; source: SourceRecord };
  classifications: Classification[];     // e.g. { scheme: 'spectral-type', value: 'M5.5V', source }
  relations: Relationship[];              // outgoing edges
  evidence: EvidenceRef[];                // observation ids
}
type CatalogueId = { catalogue: 'gaia-dr3' | 'hip' | 'simbad' | 'pubchem-cid' | 'horizons'; id: string };
```

A displayed name is a displayed value: `names.source` is required. A Gaia star with no SIMBAD
name has `canonical` equal to its catalogue identifier and `source` the Gaia record.

## Relationship

```ts
interface Relationship {
  source: AtlasId; predicate: Predicate; target: AtlasId;
  status: 'observed' | 'derived' | 'inferred' | 'illustrative';
  evidence: EvidenceRef[];                // may be empty only when status is 'illustrative'
  validity?: { from: Epoch; to: Epoch };
  count?: number;                         // hasPart only: atoms of this type in the molecule
}
```

The release's edges:

| source | predicate | target | status | evidence |
|---|---|---|---|---|
| each planet, Ceres, Pluto, Halley | `orbits` | `atlas:sun` | observed | the Horizons record |
| `atlas:moon` | `satelliteOf` | `atlas:earth` | observed | the Horizons record |
| `atlas:earth` | `representativeOf` | `atlas:water` | illustrative | none |
| `atlas:water` | `composedOf` | `atlas:pubchem-962` | observed | the PubChem record |
| `atlas:pubchem-962` | `hasPart` (count 2) | `atlas:element-h` | observed | the conformer's atom list |
| `atlas:pubchem-962` | `hasPart` (count 1) | `atlas:element-o` | observed | the conformer's atom list |
| a Hipparcos-only star | `sameAs` | its SIMBAD identifier record | observed | the cross-match record |

Membership of the star sample is not a relationship: the sample is not an entity, and
`StarSample.members` holds it with the criteria beside it.

**Validation.** A relationship with status other than `illustrative` and no evidence is rejected
by the schema (edge case: "a relationship with no evidence is shown illustrative" is enforced at
build, not patched at display). `representativeOf` may only carry `illustrative`.

## Observation

```ts
interface Observation {
  id: ObservationId;                      // 'obs:<source>:<record>:<property>'
  subject: AtlasId; property: Property;
  value: number | null;                   // null: the source has none; shown as missing
  unit: Unit;
  uncertainty?: { kind: 'stddev'; sigma: number } | { kind: 'interval'; low: number; high: number };
  source: SourceRecord;
  epoch?: Epoch; frame?: Frame; method?: string;
}
type Property = 'meanRadius' | 'mass' | 'parallax' | 'raDec' | 'properMotion' | 'radialVelocity'
              | 'gMagnitude' | 'bpRp' | 'ruwe' | 'stateVector' | 'molecularFormula' | 'iupacName'
              | 'conformer' | 'atomicNumber';
interface SourceRecord {
  dataset: 'jpl-horizons' | 'nssdca-factsheet' | 'gaia' | 'hipparcos2' | 'simbad' | 'pubchem' | 'jpl-keplerian-elements';
  release: string;                        // 'DE441', 'DR3', 'I/311', the page's retrieval date, …
  record: string;                         // the row, source_id, HIP, CID, or the chunk file and line
  retrieved: string;                      // ISO instant from the manifest
}
```

**Validation.** A `stateVector`, `parallax` or `raDec` observation without `epoch` is rejected; a
`stateVector` without `frame` is rejected; an unknown `frame.kind` or `unit` is rejected; a value
outside the declared unit's domain (a negative parallax, a radius of 0) is rejected, never clamped.
`value: null` passes and must pass through every layer unchanged (scientific tier).

## Derived state

```ts
interface DerivedState<T> {
  subject: AtlasId; property: 'position' | 'distance' | 'orbitTrack';
  value: T;                               // Vector3 in a Frame at an Epoch; a Quantity; a Polyline
  status: 'derived';
  model: { name: 'hermite-state-vectors' | 'inverse-parallax' | 'keplerian-elements' | 'icrs-to-ecliptic'; version: string };
  from: ObservationId[];                  // what it was computed from
  uncertainty?: Observation['uncertainty'];
  precision?: { stated: number; unit: Unit };   // for positions: the release's measured max error
}
```

A star's distance is `DerivedState<Quantity<'pc'>>` from its parallax observation with an
`interval` uncertainty (clarification Q4). A position at a date is `DerivedState<PositionAtEpoch>`
from the two bracketing state-vector samples with `precision` from the release.

## Quantities, frames, epochs

```ts
type Unit = 'm' | 'km' | 'au' | 'pc' | 'kg' | 's' | 'd' | 'mas' | 'mas/yr' | 'km/s' | 'deg' | 'mag' | 'angstrom' | 'g/mol' | 'dimensionless';
interface Quantity<U extends Unit> { value: number; unit: U }
interface Epoch { scale: 'TDB' | 'TT' | 'UTC'; jd: number }
type Frame =
  | { kind: 'heliocentric-ecliptic'; equinox: 'J2000'; system: 'ICRF' }
  | { kind: 'geocentric-ecliptic';   equinox: 'J2000'; system: 'ICRF' }
  | { kind: 'icrs-cartesian'; origin: 'sun' }
  | { kind: 'molecular-conformer'; source: SourceRecord };
interface PositionAtEpoch { r: Vector3; frame: Frame; epoch: Epoch }
```

Conversions are named functions in `app/src/model/units.ts`, `frames.ts`, `time.ts`, each tested
against a reference value: `km→au`, `au→m`, `pc→m`, `mas→pc` (inverse parallax, with interval),
`utc→tdb`, `icrs→ecliptic` (obliquity 84381.406″), `geocentric→heliocentric` (adding Earth's state
at the same epoch, for the Moon's heliocentric drawing).

## The star sample and cross-match records

```ts
interface StarSample {
  release: 'gaia-dr3'; criteria: { parallaxMas: { gt: 100 }; parallaxOverError: { gt: 10 }; ruwe: { lt: 1.4 } };
  query: string;                          // the ADQL, verbatim
  members: AtlasId[];                     // every star, by either route
  removedByCuts: { source_id: string; failed: string[] }[];   // from the validation report
}
interface CrossMatchRecord {
  entity: AtlasId;
  records: [SourceRecord, SourceRecord];  // Hipparcos-2 and SIMBAD
  basis: 'published-cross-identification' | 'shared-catalogue-identifier' | 'position-match';
  gaiaDr3: null | string;                 // null, with the absence checked against hipparcos2_best_neighbour
  tolerance?: Quantity<'mas'>;            // position-match only
}
```

## Molecular structure

```ts
interface Conformer {
  molecule: AtlasId; source: SourceRecord;
  atoms: { index: number; element: AtlasId; position: Vector3 }[];   // in the conformer's frame, angstrom
  bonds: { a: number; b: number; order: 1 | 2 | 3 }[];
}
```

## Navigation state

Pure data, no DOM, no plane, no pixel (decision 0006). The surface derives everything it draws
from this and the model.

```ts
interface NavigationState {
  release: string;
  mode: 'spatial' | 'structural';
  focus: AtlasId;
  selection: AtlasId | null;
  breadcrumb: AtlasId[];                  // the real history, ends with focus
  scale: number;                          // metres per CSS pixel; spatial mode only
  pan: { x: number; y: number };          // metres, in the projection's plane, relative to focus
  regime: 'planetary' | 'nearby-stellar' | 'molecular';   // held for hysteresis; resolver output
  date: { utc: string };                  // civil date; epoch derived by model/time
  playing: boolean; rate: { daysPerSecond: number };
  window: { from: string; to: string };   // from the release
  announcement: { modeChange: 'entered-structural' | 'left-structural' } | null;
  offer: 'made-of' | null;                // set when scaling in stops at the minimum scale
  refusal: { date: string; window: { from: string; to: string } } | null;
}
```

**Transitions** (`app/src/navigation/transitions.ts`, each a pure function `state → state`):
`scaleBy`, `panBy`, `select`, `focus`, `back`, `enterStructural`, `setDate`, `play`, `pause`,
`setRate`, `search`. Rules enforced by the transitions and tested in `tests/navigation/`:

- `scaleBy` clamps at the focus's minimum scale and sets `offer: 'made-of'` without changing
  `mode` (FR-015a); it never changes `focus` or `selection` (FR-009).
- `focus` appends to `breadcrumb`; `back` pops and restores the previous `mode` and `regime`;
  `back` from a structural focus whose previous entry is spatial sets `announcement`.
- `enterStructural` is the only transition that sets `mode: 'structural'` and it sets
  `announcement` (FR-015).
- `setDate` outside `window` returns the same state with a `refusal` naming the window (FR-005).
- `regime` is recomputed by the resolver with hysteresis on every `scaleBy` and never on `select`.
- `search` with one match is `focus`; with several it returns candidates and the same state.

## Release and manifest

The manifest schema (`contracts/manifest.md`) adds to `data/manifests/001-prototype.yaml` the
sources `hipparcos2` and `simbad` (R4) and, per source, `licence`, `attribution` and `citation`.
`reproducible: true` is written by ingest only when every field is filled and every checksum
matches; the application reads it and shows "release 001-prototype" with the sources in the
inspector's release view (FR-018, FR-021).
