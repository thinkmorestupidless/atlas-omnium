# 0003: Frozen source snapshots in git, reproduced from a manifest; the browser calls no scientific API

*2026-10-22.* Accepted.

## Decision
`ingest/` acquires each source once, keeps the raw response under `data/raw/`, validates it,
writes curated JSON under `data/curated/` and records the query, retrieval time, source release
and checksums in `data/manifests/<release>.yaml`. The application loads curated files only. A
refresh is a new manifest entry. Raw and curated files are committed.

## Why
Reproducibility is an acceptance criterion: the demo must be rebuildable from the manifest.
Calling Horizons, the Gaia archive or PubChem from the browser would make the screen depend on
rate limits, uptime and network, and would make every displayed value untraceable to a release.
The files are small enough to live in git, and committing them is what makes the tests' reference
values stable.

## Alternatives
A build-time fetch that is not committed: reproducible only while the sources answer the same;
they do not (Horizons updates its ephemeris versions). A cache server: infrastructure the brief
declines for 001.

## Consequences
Licences and attributions are recorded per source in the manifest and rendered where the source
requires. `generated_at` and every checksum are null until ingest fills them, and the build refuses
to call a release reproducible while any is.
