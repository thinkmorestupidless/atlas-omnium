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
ingest *only:
    npx tsx ingest/run.ts data/manifests/001-prototype.yaml {{only}}

# The living features, the glossary and the specs that name them
check:
    uvx --from "git+https://github.com/thinkmorestupidless/speckit-bdd@v0.2.0#subdirectory=checker" speckit-bdd check --root . --glossary GLOSSARY.md --features features --specs specs

# Rebuild the curated data from the raw snapshots, without the network, and verify the checksums
rebuild:
    npm run rebuild

# The living features end to end in a browser
features:
    npm run features

# Screenshots at the standard scales against the approved baselines
visual:
    npm run visual

# Frame times, mark counts, load time and heap growth against dist/
perf:
    npm run perf

# The surface boundary and the TypeScript rules
lint:
    npm run lint
