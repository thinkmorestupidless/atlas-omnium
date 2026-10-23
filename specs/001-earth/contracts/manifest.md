# Contract: the release manifest

`data/manifests/<release>.yaml`, validated by `ingest/validation/manifest.ts` and by the
application at load. Extends the file that exists with the sources research R4 adds and the
per-source terms FR-021 requires.

```yaml
atlas_release: 001-prototype
generated_at: <ISO instant or null>
reproducible: <true only when ingest has verified every checksum; absent or false otherwise>
units_policy: SI-internal-with-explicit-conversions
window: { from: 2000-01-01, to: 2050-12-31, scale: TDB }
sources:
  - name: jpl-horizons
    role: ...
    endpoint: https://ssd.jpl.nasa.gov/api/horizons.api
    query_parameters: { EPHEM_TYPE: VECTORS, CENTER: ..., REF_PLANE: ECLIPTIC, REF_SYSTEM: ICRF, VEC_TABLE: '2', OUT_UNITS: KM-S, TIME_TYPE: TDB, CSV_FORMAT: 'YES', bodies: { mercury: { command: '199', step: '1 d' }, ... } }
    retrieval_time: <ISO or null>
    source_release: <'DE441' as Horizons reports, or null>
    api_version: <signature.version, or null>
    licence: <copied text or null>
    attribution: <copied text or null>
    citation: [<strings>]
    raw: [{ file: data/raw/001-prototype/horizons/mercury-2000.json, sha256: ... }, ...]
    curated: [{ file: data/curated/001-prototype/ephemeris/mercury.json, sha256: ... }, ...]
  - name: nssdca-factsheet        # pages, rows, retrieval date
  - name: gaia                    # catalogue_release: DR3; selection_query: the ADQL verbatim
  - name: hipparcos2              # catalogue_release: I/311; query verbatim; endpoint tapvizier
  - name: simbad                  # query verbatim; endpoint simbad TAP
  - name: pubchem                 # cids: [962, ...]; the exact URLs
  - name: jpl-keplerian-elements  # the page and its validity range
validation_report: <path under data/curated/<release>/validation-report.json, or null>
```

Rules:

- Every scalar above is `null` until ingest fills it; `reproducible` is written last.
- `just ingest` refreshes nothing in place: a changed query is a new release name.
- The checksum of a curated file is of its bytes; rebuilding from `raw/` without the network
  (`just rebuild`) must reproduce them exactly (SC-009, `features/release/release.feature`).
- `attribution` and `licence` are copied, never paraphrased; the application renders them as is.
