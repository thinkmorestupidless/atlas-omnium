# Data contracts

The model of reality the application loads and the pipeline that produces it. Four things are
kept apart and never conflated: an **entity**, an **observation** of it, a **derived state**
computed for a chosen time, and the **mark** drawn for it. This page covers the first three and
the data that carries them; `rendering.md` covers the mark.

## Identity

Every entity has a stable atlas id, a short opaque string that never changes once published
(`atlas:sun`, `atlas:earth`, `atlas:gaia-dr3-4472832130942575872`, `atlas:pubchem-962`). Names,
aliases and catalogue identifiers are properties of the entity, not its id. Two sources that name
the same thing are reconciled by an explicit cross-match row carrying both source records and the
basis of the match; never by comparing names.

## Types

The schema in TypeScript terms. Every curated file is validated against these (with zod) when it
is written by ingest and again when the application loads it. Field names are the contract.

```ts
type AtlasId = string & { readonly __brand: 'AtlasId' };

// 001 uses these seven. The Sun is a Star; dwarf planets, asteroids and comets are SmallBody.
// StarSystem and DwarfPlanet are reserved, and the schema rejects them until a release carries one.
type Kind = 'Star' | 'Planet' | 'Moon' | 'SmallBody'
          | 'Substance' | 'MoleculeType' | 'AtomType';

interface Entity {
  id: AtlasId;
  kind: Kind;
  names: { canonical: string; aliases: string[]; catalogue: CatalogueId[]; source: SourceRecord };
  classifications: Classification[];        // typed per domain, e.g. spectral type with its source
  relations: Relationship[];
  evidence: EvidenceRef[];
}

type Predicate =
  | 'orbits' | 'memberOf' | 'satelliteOf'               // physical: spatial and gravitational
  | 'hasPart' | 'composedOf' | 'representativeOf'       // physical: structural
  | 'observedBy' | 'derivedFrom' | 'sameAs' | 'supportedBy' | 'supersededBy';   // knowledge

interface Relationship {
  source: AtlasId; predicate: Predicate; target: AtlasId;
  validity?: { from: Epoch; to: Epoch };
  status: AssertionStatus;
  evidence: EvidenceRef[];
}

type AssertionStatus = 'observed' | 'derived' | 'inferred' | 'illustrative';

interface Observation<U extends Unit> {
  subject: AtlasId; property: Property;
  value: number | null;                      // null is a real answer: the source has none
  unit: U;
  uncertainty?: Uncertainty;                 // { kind: 'stddev' | 'interval' | 'bound', ... }
  source: SourceRecord;                      // dataset, release, record id, retrieval
  epoch?: Epoch;                             // required for a position, a velocity, a parallax
  frame?: Frame;                             // required for a position or a velocity
  method?: string;                           // instrument or model version where known
}

interface Epoch { scale: 'TDB' | 'TT' | 'TCB' | 'UTC'; jd: number }   // Julian date in that scale; Gaia's epoch is TCB
type Frame =
  | { kind: 'heliocentric-ecliptic'; equinox: 'J2000'; system: 'ICRF' }
  | { kind: 'barycentric-ecliptic';  equinox: 'J2000'; system: 'ICRF' }
  | { kind: 'geocentric-ecliptic';   equinox: 'J2000'; system: 'ICRF' }
  | { kind: 'icrs-cartesian' }                                        // stellar neighbourhood, Sun at origin
  | { kind: 'molecular-conformer'; source: SourceRecord };            // a structure's own coordinates

type Unit = 'm' | 'km' | 'au' | 'pc' | 'kg' | 's' | 'd' | 'mas' | 'deg' | 'K' | 'angstrom' | 'g/mol' | 'dimensionless';
```

A position is a `Vector3` in a `Frame` at an `Epoch` or it does not exist. Conversions between
units and frames are named functions in `app/src/model/`, each tested against a reference value;
no renderer or control multiplies by a constant.

### Knowledge quality is per property

Existence, identity, position, shape and size, movement and interpretation are separate fields
with separate uncertainties. A star with a precise parallax and no radius has a radius of `null`,
shown as missing. Nothing fills it.

## Sources for 001 and what each gives

| Source | Gives | Frame and epoch | How it enters |
|---|---|---|---|
| JPL Horizons API | state vectors (position, velocity) of the Sun, eight planets, the Moon and a few chosen bodies, sampled across the valid window | heliocentric ecliptic J2000 (ICRF), TDB; the Moon also geocentric | one request per body, fixed step, raw text kept; curated to arrays of (epoch, r, v) |
| NASA planetary fact sheets, JPL physical parameters | mean radius, mass, rotation period and the like | n/a | hand-transcribed into a curated file with the page and retrieval date as the source record; every value cites its row |
| Gaia DR3 archive (TAP, ADQL) | position, parallax, proper motion, G magnitude, BP-RP colour, with uncertainties and RUWE | ICRS, epoch J2016.0 in TCB | one ADQL query, verbatim in the manifest; curated to ICRS Cartesian with distance derived from parallax, an interval |
| Hipparcos-2 (VizieR I/311, TAP) | position, parallax and Hp magnitude of the bright stars Gaia lacks or cuts | ICRS, epoch J1991.25 in TT | one ADQL query; a star enters only through a cross-match record, after four recorded checks |
| SIMBAD (TAP) | the common names and identifiers of every star in the sample | n/a | queried by Gaia DR3 and HIP identifier, fifty at a time; names only, never a position |
| PubChem PUG REST | water (CID 962): formula, IUPAC names, molecular weight, the 3D conformer's coordinates and bonds; the elements H and O from its periodic table | the conformer's own coordinates, in ångström | three requests, raw kept; the atom types as entities with `hasPart` and counts from the molecule type |

### Solar System positions: evaluate from sampled vectors, draw tracks from elements

Two needs are met differently. **Date-driven positions** (the user moves the time) are evaluated
by interpolating Horizons state vectors sampled over the supported window, Hermite-style because
velocity is given, so every displayed position is `derived` from a named ephemeris release and
agrees with Horizons within the interpolation error the tests state. **Orbit tracks** (the thin
ellipses) are drawn from JPL's approximate Keplerian elements, which are a model with a stated
validity range and are labelled as such; a track is a `derived` curve and never the authority for
a body's position. Doing it this way keeps the data small (a ten-day step over 2000 to 2050 is
under two thousand rows per body), keeps the application offline, and gives the tests a
reference to compare against: the held-out Horizons epochs in `tests/fixtures/`.

The supported time window is the window the manifest's Horizons query covered; the time controller
shows it and refuses to leave it. The displayed civil date (UTC) is converted to TDB for the
lookup; the difference is seconds and is typed, not ignored.

### The stellar neighbourhood: a bounded, honest sample

The sample is bounded by a parallax threshold and quality cuts, both shown in the UI as the
selection criteria. The query, verbatim in the manifest, keeps the stars within 10 pc:

```sql
SELECT source_id, ra, dec, parallax, parallax_error, pmra, pmdec, pmra_error, pmdec_error,
       radial_velocity, radial_velocity_error, phot_g_mean_mag, bp_rp, ruwe, ref_epoch
FROM gaiadr3.gaia_source
WHERE parallax > 100 AND parallax_over_error > 10 AND ruwe < 1.4
```

The stars within 10 pc that the cuts removed are named in the validation report. Distance is
derived: `1000 / parallax` parsecs, with the interval `[1000/(ϖ+σ), 1000/(ϖ−σ)]` as its
uncertainty. The UI draws that interval as a dashed ring where it spans a pixel, not as a vague
glow. Positions are converted from (ra, dec,
distance) to ICRS Cartesian with the Sun at the origin, then rotated into the ecliptic so the
neighbourhood and the Solar System share one projection plane (`rendering.md`).

**The brightest stars come through cross-match records.** Gaia DR3 lacks or distrusts astrometry
for the very brightest stars. Sirius, Procyon, Vega and Alpha Centauri A are absent or cut, while
Proxima is present. The missing bright stars enter the sample from Hipparcos-2 through an explicit
cross-match record. It carries both source records and the basis of the match, a published
cross-identification. Nothing is added by name alone, and the inspector shows both records.

### The composition path is structural and representative

Earth `representativeOf`-links to the substance water with status `illustrative`: water is a
substance Earth contains, not an individually tracked part. Water `composedOf` the H₂O molecule
type (`observed`, from PubChem); the molecule type `hasPart` the atom types hydrogen and oxygen
with counts. The conformer coordinates are in their own frame and are never placed in a celestial
one. The UI announces the mode change at the first of these edges.

## The manifest freezes a release

`data/manifests/<release>.yaml` names every source, its exact query parameters, retrieval time,
source release, and the checksum of the raw response and of the curated file it became.
`ingest/` fills it; the build refuses to call a release reproducible while any field is null. The
application shows the release name and lets the evidence inspector reach the source record of any
displayed value. Licences and attributions required by each source are recorded beside the query
and rendered where the source asks.

## Ingest

`ingest/run.ts <manifest>` runs each source module in `ingest/sources/` against the network,
writes the raw response under `data/raw/`, runs `ingest/validation/` over it (required fields,
typed frames and units, no fabricated value where the source has none, rejection of an unknown
frame), writes the curated JSON under `data/curated/` and fills the manifest. Raw and curated
files are committed: they are small, and reproducibility is the point. A refresh is a new manifest
entry, never an edit to a curated file.
