# ingest

Node scripts (`tsx`) that acquire a documented snapshot from each source, validate it, write the
curated JSON under `data/curated/` and record retrieval time, parameters and checksums in the
release manifest under `data/manifests/`. Run by hand or by `just ingest`; never by the browser.

- `sources/`: one module per source (`horizons`, `gaia`, `pubchem`, `nasa-factsheet`), each with
  its exact query and the licence and attribution it requires.
- `validation/`: the checks a snapshot must pass before it is curated: required fields, typed
  frames and units, no fabricated value where the source has none.

The raw responses are kept under `data/raw/` so a curated file can be rebuilt without the network.
