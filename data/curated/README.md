Curated, validated snapshots the application loads: small JSON files, one per source and kind,
each row carrying its source record identifier, release and epoch. Written by `ingest/`, never by
hand. The manifest beside them in `../manifests/` is the release they belong to.
