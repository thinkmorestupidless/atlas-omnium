# atlas-of-everything

An explorable, connected, provenance-aware atlas of physical reality: real objects and places,
their structure, motion and relationships, navigated outwards through astronomical scales and
inwards through composition. A browser application in TypeScript, local-first, with frozen source
snapshots and no backend. Read `README.md`, then `docs/` before touching the area it covers:
`data-contracts.md` before the model or ingest, `rendering.md` before a renderer or projection,
`evaluation.md` before a test tier. The brief is `atlas-of-everything-product-spec.md`; the docs
restate it as contracts and win where they disagree.

The family conventions in `../ankka-brain/conventions.md` apply where they fit a Node repository:
spec-kit with the bdd extension, thin Justfile, feature branches as worktrees, sentence-case
declarative commits, nothing committed to `main` by an agent. The feature being built is
`specs/001-earth/`; its `tasks.md` tick count is the status.

## Rules of this repository

- **No fabricated value.** A property the sources do not give is absent in the model and shown as
  missing in the UI. No default radius, no guessed distance, no placeholder epoch. A test fails on
  a numeric default standing in for a measurement.
- **Entity, observation, derived state and rendered mark are four things.** An entity has an id and
  relationships; an observation has a source record, release, epoch and uncertainty; a derived state
  (a position at a chosen time) names the observations and model it came from; a mark is pixels.
  Nothing in `app/src/renderers/` or `ui/` reads a source file, and nothing in `model/` knows a pixel.
- **Units and frames are types at every boundary.** A position is a `Vector3` in a named frame with
  an epoch, or it does not exist. Conversions are functions in `model/`, tested against reference
  values; the UI never multiplies by a constant.
- **Four navigation modes, never collapsed into zoom.** Spatial, scale, structural and temporal are
  distinct state transitions. A structural step (Earth to water) is never drawn as a continuation of
  spatial zoom, and the UI says the mode changed.
- **Identity survives representation.** The Sun at planetary scale and the stellar mark at
  neighbourhood scale are one atlas id. A regime change never reselects or renames.
- **The browser calls no scientific API.** `ingest/` acquires snapshots; the manifest freezes them;
  the application loads `data/curated/` by relative URL. A new snapshot is a new manifest entry.
- **Physical, knowledge and graphical lines are three vocabularies.** An orbit track, an
  `observedBy` edge and a label's leader line never share a style.
- Two typefaces, Bricolage Grotesque and IBM Plex Mono; colour tokens in `app/src/styles/tokens.css`.
  Colour names a scale regime only with a legend, and never a scientific property at the same time.
- Keyboard navigation and reduced motion are not a later tier; a control without both is unfinished.
- British spelling in prose; the product name and its promise keep their full stops.

## Running

| What | Command |
|---|---|
| Dev server | `npm run dev` |
| Type-check and build | `npm run build` |
| Suites | `npm test` |
| Feature checker | `just check` |
| Acquire and freeze a snapshot | `just ingest` (once `ingest/` has its first source) |

## Traps

Written the day they cost time; newest first. None yet.
