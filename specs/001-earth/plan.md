# Implementation Plan: 001 earth

**Branch**: `001-earth` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-earth/spec.md`, after clarifications Q1 to Q8.

## Summary

One browser screen that opens on Earth, scales out through the Solar System under real
time-dependent positions to a bounded Gaia neighbourhood while the Sun keeps its identity, and
descends by an announced structural step from Earth to water to its atoms, every value traceable
to a frozen release. The approach: a surface-independent core (typed model, pure navigation
state, curated release) under one browser surface (an ecliptic top-down projection, Canvas 2D
behind a renderer interface, HTML controls, pointer and keyboard), with ingest producing the
release from Horizons, the NSSDCA fact sheets, Gaia DR3, Hipparcos-2 through cross-match records,
SIMBAD and PubChem, and the living features run end to end with playwright-bdd. The decisions are
in `research.md`; the types in `data-model.md`; the boundaries in `contracts/`.

## Technical Context

**Language/Version**: TypeScript 5.9 on Node 24 (ingest, tests) and evergreen browsers (the
application); ES2023, strict, `exactOptionalPropertyTypes`.

**Primary Dependencies**: Vite 7 (dev server, build), vitest 3 (unit, scientific and navigation
tiers), zod 4 (schemas at ingest and load), yaml 2 (manifest), tsx (ingest). Added by this plan:
`@playwright/test` and `playwright-bdd` (features and visual tiers), `eslint` with a boundary rule
(contracts/surface.md). No rendering library: Canvas 2D (decision 0002). No runtime dependency in
the application beyond the browser.

**Storage**: files. `data/raw/<release>/` (source responses), `data/curated/<release>/` (what the
application loads), `data/manifests/<release>.yaml`. No database, no backend, no persistence of a
person's journey.

**Testing**: vitest for `tests/scientific/` and `tests/navigation/`; playwright-bdd for
`features/` through `tests/features/steps/`; Playwright screenshots for `tests/visual/`; a
Playwright and CDP script for `tests/performance/`; the speckit-bdd checker for the features'
consistency (`just check`).

**Target Platform**: the browser page as the first surface (decision 0006): current Chromium,
Firefox and WebKit on a laptop; touch on a tablet; a device without a strong GPU (Canvas 2D).
Static hosting of `dist/` plus `data/`.

**Project Type**: single static web application with a Node ingest pipeline beside it.

**Performance Goals**: input to paint under 100 ms (SC-008); 95th percentile frame time under
16 ms at every standard scale and through the transition on the stated test machine; the release
loaded and the first frame drawn under 3 s on that machine from a local server.

**Constraints**: no network call while running, fonts included (research R13); no fabricated
value, `null` end to end; every displayed value with a source record; keyboard and reduced motion
on every control; the curated release under 8 MB uncompressed; the surface boundary enforced by
lint; nothing committed to `main` by an agent.

**Scale/Scope**: 12 Solar System bodies with about 60,000 state-vector rows; about 300 nearby
stars; one molecule, two atom types; 7 sources; 47 living scenarios; one screen with six controls
(scale rail, time controller, breadcrumb, search, inspector, legend).

## Constitution Check

`.specify/memory/constitution.md` is the unfilled template, as in every family repository; the
family convention is to check against the repository's own rules instead. The gates are the ten
rules of `CLAUDE.md` and the ten principles of `docs/vision.md`.

| Gate | Pre-research | Post-design |
|---|---|---|
| No fabricated value | pass: `null` is a schema value; validation rejects defaults; SC-006 test | pass: `data-model.md` validation rules; held-out epochs never in the release |
| Entity, observation, derived state, mark are four things | pass: the four types in `docs/data-contracts.md` | pass: `Entity`, `Observation`, `DerivedState`, `ResolvedMark`; renderers read no file |
| Units and frames are types at every boundary | pass | pass: `Quantity<U>`, `Frame`, `Epoch`; conversions named and tested; the projection takes typed input |
| Four navigation modes never collapsed into zoom | pass: FR-015, FR-015a | pass: `enterStructural` is the only way into structural mode; `scaleBy` clamps and offers |
| Identity survives representation | pass: FR-009 | pass: the resolver is keyed by `AtlasId`; the navigation tier asserts it |
| The browser calls no scientific API | pass: decision 0003 | pass: and no font server either (R13) |
| Three vocabularies of line | pass: FR-014 | pass: `LineStyle.vocabulary`; knowledge lines only in the inspector |
| Two typefaces, tokens, colour with a legend only | pass | pass: R11 ships one ink; regime colour deferred to the sessions |
| Keyboard and reduced motion on every control | pass: FR-017 | pass: contracts/surface.md bindings; every control an HTML element |
| British spelling; the name and promise keep their stops | pass | pass |
| Vision: reality first, the universe is the interface, show the limits, time matters, traceable claims | pass | pass: the inspector, status marks, the time controller and the sample's criteria are all in the contracts |

No violation; the Complexity Tracking table is empty. One deviation from a design document,
recorded rather than hidden: `docs/data-contracts.md` sketches the Gaia cut at 20 pc; research R3
chooses 10 pc with the reason. The document is updated by a task.

## Project Structure

### Documentation (this feature)

```text
specs/001-earth/
├── spec.md
├── plan.md              # this file
├── research.md          # R1 to R15
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── curated-files.md
│   ├── manifest.md
│   └── surface.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks, not written here
```

### Source Code (repository root)

```text
app/
├── index.html                      # lock-up, canvas, the HTML controls; fonts self-hosted
├── public/fonts/                   # Bricolage Grotesque, IBM Plex Mono (OFL), woff2
└── src/
    ├── main.ts                     # loads the release, builds the surface, starts the loop
    ├── model/                      # the core, below the surface boundary
    │   ├── ids.ts                  # AtlasId, Kind, CatalogueId
    │   ├── schema.ts               # zod schemas for every curated file and the manifest
    │   ├── entities.ts             # Entity, Relationship, lookups by id and predicate
    │   ├── observations.ts         # Observation, SourceRecord, missing values
    │   ├── derived.ts              # DerivedState, StarSample, CrossMatchRecord, Conformer
    │   ├── units.ts                # Quantity, conversions
    │   ├── frames.ts               # Frame, icrs→ecliptic, geocentric→heliocentric
    │   ├── time.ts                 # Epoch, utc→tdb, leap seconds
    │   ├── ephemeris.ts            # Hermite evaluation of sampled state vectors
    │   ├── parallax.ts             # inverse parallax with interval uncertainty
    │   ├── elements.ts             # Keplerian elements → orbit track polyline (typed)
    │   ├── release.ts              # loads manifest and curated files, refuses an unreproducible release
    │   ├── search.ts               # names and aliases → candidates with kind
    │   └── (parallax.ts, ephemeris.ts, elements.ts as listed above)
    ├── navigation/                 # the core
    │   ├── state.ts                # NavigationState
    │   ├── transitions.ts          # the pure transitions
    │   ├── resolver.ts             # (mode, scale) → regime with hysteresis; fades
    │   └── minimum-scale.ts        # a body's minimum scale
    ├── projections/                # the surface
    │   ├── projection.ts           # the Projection and View interfaces
    │   ├── ecliptic-top-down.ts
    │   └── conformer-plane.ts
    ├── renderers/                  # the surface
    │   ├── renderer.ts             # the Renderer interface, MarkStyle, LineStyle, TextStyle
    │   ├── canvas2d.ts             # the backend
    │   ├── representation.ts       # resolve(): Scene from state, model, projection
    │   ├── orbit-geometry.ts
    │   ├── points.ts
    │   ├── composition.ts
    │   └── labels.ts               # priority and collision rule
    ├── ui/                         # the surface: HTML controls
    │   ├── lockup.ts, scale-rail.ts, time-controller.ts, breadcrumb.ts, search.ts,
    │   ├── inspector.ts, legend.ts, chapter-cue.ts, announcer.ts (live region), made-of.ts,
    │   ├── metadata.ts (in-context text), status-marks.ts (the four marks as SVG), motion.ts
    ├── input/                      # the surface
    │   ├── actions.ts              # the Action enum
    │   ├── bus.ts                  # dispatch: one place where an Action becomes a transition
    │   ├── pointer.ts, keyboard.ts, touch.ts
    └── styles/
        ├── tokens.css              # exists
        └── controls.css

ingest/
├── run.ts                          # <manifest> [--only <source>]: acquire, validate, curate, fill, checksum
├── rebuild.ts                      # <manifest>: curate from raw/ only; verify checksums
├── test-release.ts                 # derives the shared-names test release
├── lib/                            # checksum, http (retry, rate limit, byte-exact raw)
├── sources/
│   ├── horizons.ts                 # vectors per body, chunked by year; elements for small bodies
│   ├── nssdca-factsheet.ts         # transcribed rows with page and retrieval date
│   ├── gaia.ts                     # the ADQL; hipparcos2_best_neighbour check
│   ├── hipparcos2.ts               # VizieR TAP I/311/hip2
│   ├── simbad.ts                   # names and identifiers
│   ├── pubchem.ts                  # CID 962 3D and 2D, element records
│   └── jpl-elements.ts             # the approximate elements table
├── validation/
│   ├── manifest.ts, observations.ts, no-defaults.ts, frames.ts, report.ts
└── curate/
    ├── entities.ts, ephemeris.ts (with held-out split), stars.ts (cross-match records), molecules.ts, precision.ts, attribution.ts

data/
├── manifests/001-prototype.yaml    # extended per contracts/manifest.md
├── manifests/shared-names.yaml     # the test release of clarification Q6
├── raw/001-prototype/<source>/...
└── curated/001-prototype/...       # contracts/curated-files.md
    curated/shared-names/...

tests/
├── fixtures/                       # horizons-held-out.json (written by ingest), iers-reference.json, a tiny star sample, water's record
├── scientific/                     # units, frames, time, ephemeris fidelity, parallax, null end to end, schema rejection
├── navigation/                     # transitions, history, resolver hysteresis, identity across regimes, announcement, refusal
├── features/steps/                 # playwright-bdd step definitions for features/**
├── visual/                         # Playwright screenshots at the standard scales; baselines
└── performance/                    # the script and README naming the test machine

playwright.config.ts                # projects: features, visual
eslint.config.js                    # the surface boundary rule
```

**Structure Decision**: the layout `README.md` and the brief already give, with three additions:
`app/src/input/` so the surface's input adapters are one directory (decision 0006 and research
R14), `ingest/curate/` so acquiring and curating are separate steps (`just rebuild` runs only the
second), and `tests/features/` and `tests/performance/` for the two tiers `docs/evaluation.md`
names and the tree did not yet have. `app/src/projections/` is surface code; its README already
says so.

## Complexity Tracking

No constitution violations to justify.

## Order of work

The tiers of `docs/evaluation.md` and the brief's days, as the dependency order `/speckit-tasks`
should follow; story priorities P1 to P7 decide what is cut if time runs short.

1. **Core types and schemas** (`model/`), the scientific tier for units, frames, time and `null`.
   Nothing draws yet.
2. **Ingest and the release**: Horizons, fact sheets and elements first (the Solar System is
   stories 1 and 2), then Gaia, Hipparcos-2 and SIMBAD (story 3), then PubChem (story 5); the
   held-out split; precision; `reproducible: true`. The ephemeris-fidelity tests go green here,
   before the renderer.
3. **Navigation state and the resolver**, with the navigation tier.
4. **The surface for story 1**: projection, Canvas 2D, orbit geometry, the lock-up, scale rail,
   breadcrumb, pointer and keyboard; the first screen; the visual tier's first baselines.
5. **Story 2**: the time controller and the epoch display.
6. **Story 3**: the points renderer, the transition and its fades, the chapter cue, the height
   tick, the legend with the criteria.
7. **Story 4**: the inspector, status marks, attribution, the release view.
8. **Story 5**: the structural step, the composition renderer, the announcer.
9. **Story 6**: the keyboard pass over every control, reduced motion, the live region, contrast.
10. **Story 7**: search, with the `shared-names` test release.
11. **The features harness** is built with story 1 and extended per story; **performance** and
    the docs updates (`docs/data-contracts.md` for R3, `README.md` status) close the feature.

## What this plan leaves to implementation

Each is a stop for Trevor if it changes a contract, otherwise a note in `tasks.md`'s "found
during implementation": the Gaia row count and which bright stars are absent (R3, R4); whether
Halley lacks a mean radius (R5); the exact PubChem URLs (R7); the licence wording copied (R8); the
scale defaults after the first screen is seen (R9); the test machine (R15).
