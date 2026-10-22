# Thin by convention: every recipe is one command, and everything works without just.

default:
    @just --list

# Install dependencies exactly as locked
install:
    npm ci

# Dev server with hot reload
dev:
    npm run dev

# Type-check, then build into dist/
build:
    npm run build

# Serve dist/ as a deploy would
preview:
    npm run preview

# The unit, scientific and navigation suites
test:
    npm test

# Acquire, validate and freeze the snapshots the manifest names (needs the network)
ingest:
    npx tsx ingest/run.ts data/manifests/001-prototype.yaml

# The living features, the glossary and the specs that name them
check:
    uvx --from "git+https://github.com/thinkmorestupidless/speckit-bdd@v0.2.0#subdirectory=checker" speckit-bdd check --root . --glossary GLOSSARY.md --features features --specs specs
