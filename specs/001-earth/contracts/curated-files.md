# Contract: curated files

What `ingest/` writes under `data/curated/<release>/` and what the application loads by relative
URL. Every file is JSON, validated by the zod schemas in `app/src/model/schema.ts` at write and at
load. A file the schema rejects stops the application with the reason; nothing is drawn from a
partially valid release.

| File | Holds | Rows in 001 |
|---|---|---|
| `entities.json` | every `Entity`, with names, classifications and relations | about 320 |
| `observations.json` | every scalar `Observation` (radii, masses, parallaxes, magnitudes, formulae); not the state vectors | about 2,500 |
| `ephemeris/<atlas-slug>.json` | one body's sampled state vectors: `{ subject, frame, scale: 'TDB', unit: 'km', source, step, rows: [jd, x, y, z, vx, vy, vz][] }` | per body, see research R1 |
| `elements.json` | Keplerian elements per tracked body with validity, for orbit tracks | 12 |
| `stars.json` | the `StarSample` and, per member, its ICRS Cartesian position derived at ingest with its source observations | about 300 |
| `cross-matches.json` | every `CrossMatchRecord` | about 7 |
| `molecules.json` | the `Conformer` of water and the atom types' records | 1 |
| `precision.json` | per body, the measured maximum position error against the held-out epochs, with the model version | 12 |
| `attribution.json` | per source: licence, attribution line, citations, as copied | 7 |

Rules:

- Numbers are JSON numbers; no value is a string to be parsed. A missing value is `null`.
- Every row carries its `SourceRecord`; a file-level `source` applies to every row of an
  ephemeris file only.
- The held-out epochs are never in an ephemeris file. Ingest withholds every 97th sample from each
  body into `tests/fixtures/horizons-held-out.json` before writing the curated file, so the
  fidelity tier compares against values the interpolation never saw.
- File order is deterministic (sorted by id, then epoch) so the checksums in the manifest are
  stable across rebuilds.
- The application fetches `data/manifests/<release>.yaml` first, refuses a release whose
  `reproducible` is not `true` unless started with `?allow-unreproducible` (development only, and
  the screen says so), then fetches the files in parallel.
