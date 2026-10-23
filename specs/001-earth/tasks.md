# Tasks: 001 earth

**Input**: Design documents from `specs/001-earth/`: `plan.md`, `spec.md`, `research.md`,
`data-model.md`, `contracts/` (`curated-files.md`, `manifest.md`, `surface.md`), `quickstart.md`.

**Tests**: included. `docs/evaluation.md` names the tiers and says the scientific tier is written
before the renderer; the spec's SC-002, SC-004, SC-006 and SC-009 are automated checks; the living
features under `features/` are the acceptance scenarios and run through playwright-bdd (R12).
A test task is written before the code it proves and must fail first.

**Organization**: by user story in the spec's priority order. If time runs short the outward
stories (US1 to US4) are kept whole and US5, then US7, are deferred (spec, "User Scenarios").

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US7, the spec's user stories
- Paths are from the repository root; the tree is `plan.md`'s

## Conventions that bind every task

- British spelling in prose; the product name and promise keep their full stops.
- No value is ever defaulted: a property the source lacks is `null` in the model and "missing" in
  the UI. A test that finds a numeric default fails.
- Nothing under `app/src/model/`, `app/src/navigation/` or `data/` imports from
  `app/src/projections/`, `renderers/`, `ui/` or `input/` (decision 0006; lint T008).
- Commit after each task or logical group in the family's style: "Tasks: T0NN, ..." with the
  resulting fact; never to `main`.
- Anything a task finds that the plan left open goes under "Found during implementation" in
  `research.md`; anything that would change a contract stops for Trevor.

---

## Phase 1: Setup

**Purpose**: the toolchain the plan adds, the tree, the boundary rule, the fonts.

- [X] T001 Create the directories of `plan.md`'s tree that do not exist yet, each with a one-paragraph `README.md` in the style of the existing ones: `app/src/input/`, `app/public/fonts/`, `ingest/sources/`, `ingest/validation/`, `ingest/curate/`, `tests/fixtures/`, `tests/scientific/`, `tests/navigation/`, `tests/features/steps/`, `tests/visual/`, `tests/performance/`, `data/raw/001-prototype/`, `data/curated/001-prototype/`
- [X] T002 Add `@playwright/test`, `playwright-bdd`, `eslint`, `@eslint/js`, `typescript-eslint` as devDependencies in `package.json` at exact versions at least two weeks old, and the scripts `features` (`bddgen && playwright test --project features`), `visual` (`playwright test --project visual`), `perf` (`tsx tests/performance/run.ts`), `lint` (`eslint .`), `rebuild` (`tsx ingest/rebuild.ts data/manifests/001-prototype.yaml`); run `npm install` and commit the lockfile
- [X] T003 [P] Add the Justfile recipes `rebuild`, `features`, `visual`, `perf`, `lint`, one command each, mirroring `package.json`, in `Justfile`
- [X] T004 [P] Write `playwright.config.ts` with two projects, `features` (playwright-bdd `defineBddConfig` over `features/**/*.feature` with steps in `tests/features/steps/**`) and `visual` (`tests/visual/**`), both against `vite preview --port 4173` of `dist/` as `webServer`, Chromium only, `reducedMotion` left to each test
- [X] T005 [P] Vendor Bricolage Grotesque (variable, opsz and wght) and IBM Plex Mono 400 and 500 as woff2 under `app/public/fonts/` with their OFL licence files, add `@font-face` rules in `app/src/styles/tokens.css`, and remove the three Google Fonts `<link>` tags from `app/index.html` (R13)
- [X] T006 [P] Add `tests/visual/.gitattributes` marking PNG baselines binary and a `tests/performance/README.md` with a "Test machine" section left for the machine's name and specification (R15)
- [X] T007 [P] Extend the existing `.github/workflows/ci.yml` (Node 24, `ubuntu-24.04`, already runs build, test and the checker): add `npm run lint` before the build, and after the build `npx playwright install --with-deps chromium` (cached) and `npm run features`; keep the single job
- [X] T008 Write `eslint.config.js` with the surface boundary: `no-restricted-imports` forbidding `app/src/model/**` and `app/src/navigation/**` from importing `../projections`, `../renderers`, `../ui`, `../input` and `vite/client`, plus `typescript-eslint` recommended; make `npm run lint` pass on the current tree (contracts/surface.md)

**Checkpoint**: `npm run lint`, `npm test`, `npm run build`, `just check` green on an empty feature.

---

## Phase 2: Foundational

**Purpose**: the core types every story reads, the manifest and ingest skeleton, the navigation
state, the surface skeleton, the feature harness. No story can start before this phase.

### Model (the core)

- [X] T009 [P] Write `tests/scientific/units.test.ts`: `km→au`, `au→m`, `pc→m`, `mas→pc` round-trips against the IAU 2012 au (149597870.7 km) and the parsec (3.0856775814913673e16 m); an unknown unit string is rejected by the schema; a `Quantity` with a negative parallax is rejected
- [X] T010 [P] Write `tests/scientific/time.test.ts`: `utc→tdb` for 2000-01-01T12:00Z gives JD 2451545.000800741 (TT) within 1e-9 d; a date before 2017-01-01 uses the earlier ΔAT; the TDB−TT neglect is under 2 ms and documented (R2); fixture `tests/fixtures/iers-reference.json`
- [X] T011 [P] Write `tests/scientific/frames.test.ts`: `icrs→ecliptic` of the north ecliptic pole (RA 270°, Dec 66.56071°) gives (0, 0, 1) within 1e-8; the obliquity is 84381.406″; an unknown `frame.kind` is rejected at the schema; `geocentric→heliocentric` adds Earth's state at the same epoch and refuses mismatched epochs
- [X] T012 [P] Write `tests/scientific/null.test.ts`: an `Observation` with `value: null` loads through the schema, through `observations.ts` lookups and through a `DerivedState` request as `null`, never `0`, `NaN` or `undefined` (SC-006); a curated file with a numeric default where the fixture says the source has none fails `ingest/validation/no-defaults.ts`
- [X] T013 Write `app/src/model/ids.ts`: `AtlasId` brand, `Kind` (the seven of `data-model.md`; `StarSystem` and `DwarfPlanet` rejected), `CatalogueId`, the fixed ids table of the release
- [X] T014 Write `app/src/model/units.ts`: `Unit`, `Quantity<U>`, the named conversions, constants with their source in a doc comment; makes T009 pass
- [X] T015 [P] Write `app/src/model/time.ts`: `Epoch`, the leap-second table, `utcToTdb`, `tdbToUtcDate`, `jdFromIsoUtc`; makes T010 pass
- [X] T016 [P] Write `app/src/model/frames.ts`: `Frame`, `Vector3`, `PositionAtEpoch`, `icrsToEcliptic`, `geocentricToHeliocentric`; makes T011 pass
- [X] T017 Write `app/src/model/schema.ts`: zod schemas for `Entity`, `Relationship` (evidence required unless `illustrative`; `representativeOf` only `illustrative`), `Observation` (epoch required for `stateVector`, `parallax`, `raDec`; frame required for `stateVector`; value domains), `DerivedState`, `StarSample`, `CrossMatchRecord`, `Conformer`, every curated file of `contracts/curated-files.md`, and the manifest of `contracts/manifest.md`; export the inferred types
- [X] T018 [P] Write `app/src/model/entities.ts` (lookups by id, by predicate, outgoing and incoming relations) and `app/src/model/observations.ts` (lookup by subject and property returning `Observation | 'missing'`); makes T012's loading half pass
- [X] T019 [P] Write `app/src/model/derived.ts`: `DerivedState<T>`, `StarSample`, `CrossMatchRecord`, `Conformer` types and the `Model` aggregate (entities, observations, ephemeris handles, stars, cross-matches, molecules, precision, attribution)
- [X] T020 Write `app/src/model/release.ts`: fetch `data/manifests/<release>.yaml`, refuse `reproducible !== true` unless `?allow-unreproducible` with a visible banner flag returned, fetch the curated files in parallel by relative URL, validate each with T017, return a `Model`; `tests/scientific/release.test.ts` with a minimal fixture release under `tests/fixtures/release-minimal/` proves the refusal and the load

### Manifest and ingest skeleton

- [X] T021 Extend `data/manifests/001-prototype.yaml` to `contracts/manifest.md`: `reproducible` absent, `window`, the sources `hipparcos2`, `simbad` and `jpl-keplerian-elements` added, and per source `licence`, `attribution`, `citation`, `raw`, `curated`, `api_version` or `query` as the contract lists, every scalar `null`
- [X] T022 [P] Write `ingest/validation/manifest.ts` (the schema from T017 plus "every scalar filled" and "every checksum present" checks that name the first unfilled field) and `tests/scientific/manifest.test.ts` proving a manifest with one `null` is reported by field name and is not reproducible (`features/release/release.feature`, second scenario)
- [X] T023 [P] Write `ingest/validation/no-defaults.ts`, `ingest/validation/frames.ts`, `ingest/validation/observations.ts` (required fields, typed units and frames, value domains, nothing filled where the raw record has no value) and `ingest/validation/report.ts` (writes `validation-report.json`: counts, rejections, and the sections later tasks append)
- [X] T024 Write `ingest/run.ts <manifest> [--only <source>...]`: for each source module under `ingest/sources/` (or only the named ones, leaving the others' fields `null` and `reproducible` unset) acquire into `data/raw/<release>/<source>/`, record retrieval time, release and checksums, then call `ingest/rebuild.ts`'s curate step and write the manifest with `reproducible: true` only when every check passes; `ingest/rebuild.ts <manifest>`: curate from `raw/` only, with network access disabled (`globalThis.fetch` replaced by a function that throws), compare every curated checksum with the manifest and exit non-zero naming a mismatch or an unfilled field; a shared `ingest/lib/checksum.ts` (sha256) and `ingest/lib/http.ts` (fetch with retry, rate limit per source, raw body kept byte-exact)
- [X] T025 Write `ingest/curate/attribution.ts`: per source, copy `licence`, `attribution`, `citation` from the manifest into `data/curated/<release>/attribution.json` unchanged (FR-021)

### Navigation (the core)

- [X] T026 [P] Write `tests/navigation/transitions.test.ts` against `data-model.md`'s rules: `scaleBy` never changes focus or selection; it clamps at the minimum scale and sets `offer: 'made-of'` without changing `mode`; `focus` appends and `back` pops and restores mode and regime; `enterStructural` is the only transition that sets `mode: 'structural'` and sets `announcement`; `back` out of the structural branch sets `announcement`; `setDate` outside the window returns the same state with `refusal`; `select` never changes `regime`; `search` with one match focuses, with several returns candidates and leaves the state
- [X] T027 [P] Write `tests/navigation/resolver.test.ts`: the regime is `planetary` below 3 × 10¹² m/px, `nearby-stellar` above 1 × 10¹³ going out and below 3 × 10¹² coming back (hysteresis), `molecular` whenever `mode` is `structural`; the fade of tracks, discs and points is a pure function of scale and `fade(scaleOut)` then `fade(scaleBack)` return the same values; identity: focus and selection ids are the same before and after a transition in both directions (SC-004)
- [X] T028 Write `app/src/navigation/state.ts` (`NavigationState` with `offer`, `refusal`, `announcement`), `app/src/navigation/transitions.ts` (the eleven pure transitions), `app/src/navigation/resolver.ts` (`regimeFor`, `fadesAt`, the band constants of R9 in one exported table), `app/src/navigation/minimum-scale.ts` (a body's minimum scale from its radius and a viewport side, or a release default when the radius is missing); makes T026 and T027 pass

### Surface skeleton and feature harness

- [X] T029 [P] Write `app/src/renderers/renderer.ts` (the `Renderer` interface, `MarkStyle`, `LineStyle` with `vocabulary: 'physical' | 'graphical'`, `TextStyle`, `ScreenPoint`) and `app/src/renderers/canvas2d.ts` implementing it with device-pixel-ratio handling, crisp hairlines and the cream clear colour from tokens
- [X] T030 [P] Write `app/src/input/actions.ts` (the `Action` union of `contracts/surface.md`) and `app/src/input/bus.ts` (subscribe, dispatch; one place where an `Action` becomes a transition)
- [X] T031 [P] Write `app/src/projections/projection.ts` (the `Projection` and `View` interfaces with `flattens`) and `app/src/renderers/representation.ts`'s types (`Scene`, `ResolvedMark`, `ResolvedLine`, `ChapterCue`) without the resolver body
- [X] T032 Rewrite `app/src/main.ts`: load the release (T020), build the navigation state at the opening scale with focus and selection `atlas:earth` and the release's window, create the Canvas 2D backend, wire the bus, render a cream canvas with the lock-up; show the unreproducible banner when T020 says so; make `npm run build` and `npm run dev` work
- [X] T033 Write the harness in `tests/features/steps/world.ts` (a playwright-bdd fixture that opens the preview with a chosen release and exposes `atlas.state()` through a `window.__atlas` test hook enabled by `?test` only; it also passes `allow-unreproducible` until T074 lands, after which that flag is removed and its absence is asserted; and it routes every request, failing the scenario on any request to a host other than the preview server, which proves FR-018's "no external call" for every scenario) and the Background steps in `tests/features/steps/common.steps.ts`: "the atlas is open on the release {string}", "the atlas is open on the test release {string}", "the focus is {string}", "the selection is {string}", "spatial navigation is in force", "the {word} regime is in force", "the planetary regime is in force", "the nearby stellar regime is in force"; `npm run features` runs and every scenario fails on an undefined or pending step, none on a harness error

**Checkpoint**: `npm test` green for the scientific and navigation tiers; `npm run features`
reports 47 scenarios, all pending; `npm run dev` shows the cream canvas and lock-up.

---

## Phase 3: User Story 1 - Explore the Solar System from Earth (Priority: P1) 🎯 MVP

**Goal**: Earth as the focus on the first screen; scaling out brings the Moon, then the Sun, the
eight planets and their orbit tracks; select, focus, back; exaggeration labelled, true distance
readable; a body without a radius drawn as a point.

**Independent Test**: open the atlas, scale out to the heliocentric view, select and focus Mars,
read its distance and source, go back to Earth; every scenario of
`features/solar-system/explore.feature` passes.

### Tests for User Story 1

- [X] T034 [P] [US1] Write `tests/scientific/ephemeris.test.ts`: Hermite evaluation of sampled state vectors at every held-out epoch in `tests/fixtures/horizons-held-out.json` is within the per-body precision recorded in `data/curated/001-prototype/precision.json` for every supported body (SC-002); an epoch outside the window throws a typed `OutsideWindow`; the evaluation between two samples at the samples themselves returns the samples exactly; the fixture file is read, and the test is skipped with a named reason until ingest writes it
- [X] T035 [P] [US1] Write `tests/scientific/elements.test.ts`: the orbit track from the JPL elements of Earth at J2000 has perihelion and aphelion distances 0.98329 au and 1.01671 au within 1e-4 au and lies in the ecliptic plane; a track carries `status: 'derived'`, its model name and its validity range
- [ ] T036 [P] [US1] Write `tests/features/steps/explore.steps.ts` for the nine scenarios of `features/solar-system/explore.feature`: "the person opens the atlas", "the person scales out", "scales out past {string}", "selects {string}", "focuses the selection", "goes back", "chooses the scale policy {string}", "selects the body" (the curated body with no radius, from the validation report), and the Then steps on visibility of marks, the breadcrumb, the metadata text, the exaggeration label and factor, the point mark and "missing"

### Ingest for User Story 1

- [X] T037 [P] [US1] Write `ingest/sources/horizons.ts`: per body of R1's table, VECTORS requests chunked by calendar year with the parameters of R1, raw JSON kept per chunk under `data/raw/001-prototype/horizons/<slug>-<year>.json`, the `signature.version` checked and recorded, the ephemeris version parsed from the result header into `source_release`; ELEMENTS at J2000 for Ceres, Pluto and Halley under `horizons-elements/`
- [X] T038 [P] [US1] Write `ingest/sources/nssdca-factsheet.ts`: the transcribed rows (mean radius, mass) for the Sun, the eight planets, the Moon, Pluto and Ceres with page URL, row label and retrieval date per value, and `null` with the page cited where a page gives no mean radius (R5: Halley expected); the fetched page bytes kept under `data/raw/001-prototype/nssdca/` so the transcription can be audited
- [X] T039 [P] [US1] Write `ingest/sources/jpl-elements.ts`: the approximate Keplerian elements table for the eight planets (1800 to 2050) and the Moon's mean geocentric elements, transcribed with page URL and retrieval date, raw page kept
- [X] T040 [US1] Write `ingest/curate/ephemeris.ts`: parse each body's chunks, concatenate in epoch order, withhold every 97th row into `tests/fixtures/horizons-held-out.json`, write `data/curated/001-prototype/ephemeris/<slug>.json` per `contracts/curated-files.md`; append the row counts to the validation report (precision is T042's, after the model exists)
- [X] T041 [US1] Write `ingest/curate/entities.ts` for the Solar System: the twelve `Entity` rows with ids from T013, kinds per Q5, names with the Horizons record as source, `orbits` and `satelliteOf` relations with evidence, the `meanRadius` and `mass` observations into `observations.json` (null preserved), and `elements.json`; run `just ingest --only jpl-horizons nssdca-factsheet jpl-keplerian-elements` (the other sources stay `null`; the release is not yet reproducible) and commit `data/raw/001-prototype/` and `data/curated/001-prototype/` for them

### Model and surface for User Story 1

- [X] T042 [US1] Write `app/src/model/ephemeris.ts`: load an ephemeris file lazily by subject, binary search the bracketing samples, cubic Hermite with velocities, return `DerivedState<PositionAtEpoch>` naming the two sample ids, the model `hermite-state-vectors` and the release's precision; `OutsideWindow` typed error; then `ingest/curate/precision.ts`: evaluate this model at every held-out epoch and write the maximum error per body with the model version into `precision.json` (FR-006), appended to the validation report; run `just rebuild` so `precision.json` exists and T034 runs unskipped and passes
- [X] T043 [P] [US1] Write `app/src/model/elements.ts`: a typed orbit track polyline (heliocentric ecliptic, N points by eccentricity) from Keplerian elements as `DerivedState<Polyline>` with validity; makes T035 pass
- [ ] T044 [P] [US1] Write `app/src/projections/ecliptic-top-down.ts`: `project` and `unproject` between heliocentric ecliptic positions and screen points for a `View` (scale, centre, pan), `flattens: { dimension: 'ecliptic-z', declared: true }`, the Moon's geocentric position converted with `geocentricToHeliocentric` at the same epoch before projection
- [ ] T045 [US1] Write `app/src/renderers/representation.ts`: `resolve(state, model, projection, viewport)` → `Scene`: for the planetary regime, a disc per body at its evaluated position for the state's epoch with scale policy applied (`exaggerated`: a true disc under 3 px is drawn at 3 px with the factor; `true`: never enlarged; a body with `meanRadius` missing is a 1 px point and no factor), the orbit tracks as physical lines, the focus and selection marks, labels by priority (focus, selection, per-regime importance), fades from the resolver
- [ ] T046 [US1] Write `app/src/renderers/orbit-geometry.ts` (discs, rings, tracks through the `Renderer`) and `app/src/renderers/labels.ts` (collision pass: drop, never overlap), and the frame loop in `app/src/main.ts` that resolves and draws on state change and on `requestAnimationFrame` while a fade or play is active
- [ ] T047 [P] [US1] Write `app/src/ui/lockup.ts` (the existing header, moved), `app/src/ui/scale-rail.ts` (logarithmic rail with the physical scale, the regime bands from the resolver's table, the flattened-dimension note from the projection; keyboard-focusable; FR-010), `app/src/ui/breadcrumb.ts` (canonical names of the breadcrumb ids; each a button that goes back to it), `app/src/ui/metadata.ts` (the small in-context text for the selection: canonical name, distance from the Sun with unit, exaggeration label and factor, "missing" for a null radius, and the source record's dataset and release), and `app/src/styles/controls.css`
- [ ] T048 [P] [US1] Write `app/src/input/pointer.ts` (wheel and trackpad scale about the pointer, drag pan, click select, double click focus, hit-testing on resolved marks with a minimum 12 px target), `app/src/input/keyboard.ts` (the bindings table of `contracts/surface.md`: `+` `-`, Shift+arrows scale, Alt+arrows pan, arrows move selection among visible marks, Enter focus, Backspace back, `x` scale policy) and `app/src/input/touch.ts` (pinch, drag, tap, second tap)
- [ ] T049 [US1] Write `app/src/ui/made-of.ts` as the offer only: when `state.offer === 'made-of'` show the "what is it made of?" control beside the scale rail, disabled with a note until US5 lands; and the minimum-scale clamp wired through `scaleBy` (FR-015a, the composition feature's last scenario stays pending until US5)
- [ ] T050 [US1] Make the nine `explore.feature` scenarios pass with T036's steps; add `tests/visual/standard-scales.spec.ts` taking the first baselines at the opening scale, the Moon-in-view scale and the heliocentric scale, committed under `tests/visual/baselines/`

**Checkpoint**: US1 works alone: the first screen, the Solar System, selection, focus, back,
exaggeration; `explore.feature` 9 of 9; ephemeris fidelity green for the twelve bodies.

---

## Phase 4: User Story 2 - Move through time (Priority: P2)

**Goal**: the time controller with the supported window; changing the date moves every supported
body; play and pause at a rate; the epoch always visible; a date outside the window refused.

**Independent Test**: set 2030-01-01 and see the bodies move with the epoch shown; set 2100-01-01
and see it refused with the window; play ten seconds at one day per second and pause;
`features/time/time.feature` passes.

- [ ] T051 [P] [US2] Write `tests/features/steps/time.steps.ts` for the six scenarios of `features/time/time.feature`: "the person opens the time controller", "the date is {string}", "the date is {string} and the supported window ends at {string}" (a precondition checked against the release, pending if it does not hold), "changes the date to {string}", "plays for {string} and pauses" (using Playwright's clock), "a held-out epoch of the reference ephemeris", and the Then steps on the window shown, every supported body at its derived state (read through the test hook and compared to `ephemeris.ts`), the refusal text with the window, the epoch display "2030-01-01" with its time scale, and the stated precision
- [ ] T052 [US2] Write `app/src/ui/time-controller.ts`: the window's first and last date; a date field (`d`), play and pause (`t`, space), rate (`[` `]`, shown as "n days per second"); the epoch of the displayed positions as the civil date and its TDB Julian date with the scale name, always visible; refusal shown inline with the window and the state's date unchanged (FR-005); dispatches `setDate`, `play`, `pause`, `setRate`
- [ ] T053 [US2] Add the play loop to `app/src/main.ts`: while `playing`, advance the date by `rate × elapsed` per frame through `setDate`, stop at the window's end with a refusal shown, and re-resolve the scene; reduced motion does not affect play (it is not a transition)
- [ ] T054 [US2] Make the six `time.feature` scenarios pass; add the time controller to the visual baselines

**Checkpoint**: US1 and US2 together: the Solar System moves with the date; `time.feature` 6 of 6.

---

## Phase 5: User Story 3 - Travel out to the nearby stars (Priority: P3)

**Goal**: scaling out past Neptune fades the tracks, the Sun becomes a stellar mark without
moving and keeps its selection, the Gaia sample appears with the Sun among it, a star shows its
derived distance with its range and parallax record, the bright stars enter through cross-match
records, the criteria are shown, scaling back reverses exactly, the rail declares the flattening.

**Independent Test**: select the Sun at planetary scale, scale out until stars appear, confirm the
Sun is still selected and at the same pixel, select Proxima Centauri and read its distance range,
select Alpha Centauri A and see the cross-match record, scale back in;
`features/stars/neighbourhood.feature` passes.

### Tests for User Story 3

- [ ] T055 [P] [US3] Write `tests/scientific/parallax.test.ts`: inverse parallax of 768.07 ± 0.05 mas gives 1.3020 pc with the interval [1000/768.12, 1000/768.02] pc, `status: 'derived'`, model `inverse-parallax`, `from` naming the parallax observation; a parallax of `null` gives a distance of `null`; a negative parallax is rejected at the schema
- [ ] T056 [P] [US3] Write `tests/scientific/stars.test.ts` against `tests/fixtures/star-sample-tiny.json` (five rows transcribed from Gaia DR3 with their `source_id`): ICRS Cartesian from (ra, dec, derived distance) and rotation into the ecliptic match reference values computed independently in the fixture within 1e-6 pc; the sample's `criteria` and `query` equal the manifest's; every member is in `entities.json`; every `CrossMatchRecord` has two records, a basis, and `gaiaDr3: null` only when the validation report records the absence
- [ ] T057 [P] [US3] Write `tests/features/steps/neighbourhood.steps.ts` for the nine scenarios of `features/stars/neighbourhood.feature`: "scales out past the orbit track of {string}", "scales out until the nearby stellar regime is in force", "scales in until the planetary regime is in force", "opens the legend", "reads the scale rail", "focuses {string}", and the Then steps: tracks faded (alpha read through the hook), "{string} is visible as a stellar mark at the same place on the screen" (pixel equality within 0.5 px before and after), the selection and breadcrumb unchanged, the nearby stars visible, the metadata with distance, unit and range, the inspector with the parallax observation and model (pending until US4 for the inspector half), no mark for an entity without a source record, the criteria with the catalogue release, the flattened dimension declared, the cross-match record with both source records and the basis

### Ingest for User Story 3

- [ ] T058 [P] [US3] Write `ingest/sources/gaia.ts`: the ADQL of R3 verbatim against the archive's TAP sync endpoint (VOTable or CSV, raw kept), the `gaiadr3.hipparcos2_best_neighbour` query for every HIP number T059 yields, retrieval time and `catalogue_release: DR3` recorded; the row count, Proxima's presence and the stars removed by each cut appended to the validation report (R3 verify)
- [ ] T059 [P] [US3] Write `ingest/sources/hipparcos2.ts`: VizieR TAP (`I/311/hip2`, `Plx > 100`) with the query verbatim, raw kept, catalogue release `I/311`
- [ ] T060 [P] [US3] Write `ingest/sources/simbad.ts`: SIMBAD TAP, `basic` joined to `ident`, by Gaia DR3 `source_id` and by HIP number, main identifier and common names, raw kept, the query verbatim
- [ ] T061 [US3] Write `ingest/curate/stars.ts`: a `Star` entity per Gaia row (`atlas:gaia-dr3-<source_id>`, names from SIMBAD with the SIMBAD record as source or the catalogue identifier when none), the observations `parallax`, `raDec`, `properMotion`, `radialVelocity` (null where Gaia has none), `gMagnitude`, `bpRp`, `ruwe` with Gaia records and epoch J2016.0; the derived distance and the ICRS Cartesian position at ingest (`stars.json`); the `StarSample` with criteria, query, members and `removedByCuts` (membership lives there, not as a relation); for every Hipparcos-2 star within 10 pc absent from Gaia and from `hipparcos2_best_neighbour`, a `Star` entity `atlas:hip-<HIP>` with its parallax observation from Hipparcos-2 and a `CrossMatchRecord` (Hipparcos-2 record, SIMBAD record, basis `published-cross-identification`, `gaiaDr3: null`) into `cross-matches.json`; each cross-matched star named in the validation report with its basis (FR-008a); run `just ingest` and commit the raw and curated files for the three sources
- [ ] T062 [US3] Write `app/src/model/parallax.ts` (makes T055 pass) and extend `app/src/model/release.ts` and `derived.ts` to load `stars.json` and `cross-matches.json`; `tests/scientific/stars.test.ts` passes against the curated release

### Surface for User Story 3

- [ ] T063 [US3] Extend `app/src/renderers/representation.ts` for the nearby stellar regime: a point per member at its ecliptic position (Sun at the origin), size by the legend's rule (G magnitude bands), a ring whose radius is the distance range in the projection, a height tick for the ecliptic z, the Sun as one point among them keeping its id, focus and selection marks; the transition: tracks thin then fade, discs before tracks, the Sun's disc to its point at the same screen point, points fading in, all as functions of scale from the resolver; under `prefers-reduced-motion: reduce` every fade is a step at the band's midpoint (3 × 10¹² m/px) and the focus move is a cut (the control is unfinished without it, `CLAUDE.md`); the chapter cue ("nearby stars", "the Solar System") at the band crossing
- [ ] T064 [P] [US3] Write `app/src/renderers/points.ts` (points, rings, ticks through the `Renderer`) and `app/src/ui/chapter-cue.ts` (large Bricolage name, receding; a one-second static display under reduced motion)
- [ ] T065 [P] [US3] Write `app/src/ui/legend.ts` (`l`; marks by regime, the four status marks of R11, the selection and focus marks, the three line vocabularies, the star sample's selection criteria in words with the catalogue release and the count; shown once on first use) and extend `app/src/ui/scale-rail.ts` to declare "a dimension is flattened: height above the ecliptic shown as a tick" in the nearby stellar band
- [ ] T066 [US3] Extend `app/src/ui/metadata.ts` for a star: canonical name, distance from the Sun with unit and its range, the parallax's source record (dataset, release, record); for a cross-matched star the two records and the basis
- [ ] T067 [US3] Make the `neighbourhood.feature` scenarios pass (the inspector halves of two scenarios wait for US4 and are marked with a tag `@needs-inspector` the config skips until T075); add the transition midpoint and the stellar scale to the visual baselines; add `tests/navigation/identity.test.ts` driving the real resolver and representation with the curated release: the Sun's screen point is equal within 0.5 px at every scale through the band in both directions (FR-009)

**Checkpoint**: the signature transition works and reverses; the sample is real and bounded;
every bright star has its cross-match record; `neighbourhood.feature` 7 of 9 (2 waiting on US4).

---

## Phase 6: User Story 4 - Inspect the evidence (Priority: P4)

**Goal**: every displayed value opens to its source record, dataset release, epoch, frame, unit,
uncertainty and attribution without leaving the scene; missing shown as missing; status marks apart
from selection; the release named with every source; the release reproducible from its manifest.

**Independent Test**: open the inspector on Mars's distance and follow it to the record, release,
epoch and attribution; find the body without a radius and see "missing"; open the release view and
read the sources; `just rebuild` reproduces the checksums; `features/evidence/inspector.feature`
and `features/release/release.feature` pass.

### Tests for User Story 4

- [ ] T068 [P] [US4] Write `tests/features/steps/inspector.steps.ts` for the eight scenarios of `features/evidence/inspector.feature`: "inspects the distance from {string}", "inspects the position", "inspects the radius of the body", "inspects the relationship {string} to {string}", "inspects every visible mark", "opens the inspector", "opens the inspector on the release {string}", and the Then steps on the source record, dataset release, epoch and time scale, reference frame, "missing" with no number, uncertainty with value and unit, the status mark distinct from the selection mark (different shape, checked through the hook's mark registry) and not colour alone, every mark resolving to an id with a source record or an illustrative label, the release name, the attribution beside the dataset release, every source listed with licence and attribution
- [ ] T069 [P] [US4] Write `tests/features/steps/release.steps.ts` for `features/release/release.feature`: run `ingest/rebuild.ts` in Node with the network disabled against the committed manifest and raw files and assert the checksums match; run it against a copy of the manifest with one field set to `null` and assert the non-zero exit names the field and the release is not called reproducible (SC-009, FR-019)

### Implementation for User Story 4

- [ ] T070 [US4] Write `app/src/ui/inspector.ts`: a panel beside the scene (`i` on the selection, click or tap on a value or relationship) showing per `contracts/surface.md`: value and unit, uncertainty (σ or interval), status mark and word, source record (dataset, release, record, retrieved), epoch with time scale, frame, the model and `from` inputs for a derived state with the stated precision, the attribution line beside the dataset release from `attribution.json`, both records and the basis for a cross-matched star, "missing" and no number for `null`; knowledge relations (`derivedFrom`, `sameAs`, `observedBy`) drawn here only, as dashed HTML rules with the predicate as label (FR-014)
- [ ] T071 [P] [US4] Write `app/src/ui/status-marks.ts`: the four status marks of R11 as inline SVG (filled disc, half disc, open ring, dashed ring) used by the inspector, the metadata and the legend; the selection ring and focus weight defined in `app/src/renderers/representation.ts` share no shape with them; a unit test `tests/navigation/marks.test.ts` asserting the five shapes are pairwise distinct by name and that each status also carries its word (FR-013)
- [ ] T072 [US4] Add the release view to `app/src/ui/inspector.ts`: the release name, window, `reproducible`, every source with its role, release, licence, attribution and citations from `attribution.json`, the star sample's criteria and count (FR-018, FR-021)
- [ ] T073 [US4] Add the "every visible mark" registry to the test hook in `app/src/main.ts` (`window.__atlas.marks()` → ids with their status and source presence) and make the illustrative label visible on marks whose entity has no source record (none expected in 001; the check proves it)
- [ ] T074 [US4] Finish `just ingest` end to end: `attribution.json` filled from the copied terms (R8), `reproducible: true` written, `validation-report.json` complete, and `just rebuild` green without the network; commit the manifest, raw and curated files
- [ ] T075 [US4] Make `inspector.feature` 8 of 8 and `release.feature` 2 of 2 pass, and remove the `@needs-inspector` skip so `neighbourhood.feature` is 9 of 9; add the inspector and the release view to the visual baselines

**Checkpoint**: the outward journey is whole and every value traceable; the release is
reproducible. This is the line the spec protects if time runs short.

---

## Phase 7: User Story 5 - Descend into what Earth is made of (Priority: P5)

**Goal**: the explicit structural step from Earth, announced; water as a representative substance;
the water molecule with H×2 and O×1 in the conformer's frame; back to Earth in spatial navigation,
announced; scaling in past the minimum offers the step.

**Independent Test**: from Earth enter the composition branch, reach the hydrogen atom type, read
its source, go back to Earth; the mode change announced both ways;
`features/composition/composition.feature` passes.

### Tests for User Story 5

- [ ] T076 [P] [US5] Write `tests/scientific/molecules.test.ts` against `tests/fixtures/water-record.json`: the conformer has three atoms with elements 1, 1, 8 and two bonds; atom positions are in a `molecular-conformer` frame carrying the PubChem source record and never a celestial frame (the schema rejects a conformer with an ecliptic frame); counts from `hasPart` relations are 2 and 1; the best-fit plane of water leaves no atom more than 1e-6 Å out of plane
- [ ] T077 [P] [US5] Write `tests/features/steps/composition.steps.ts` for the six scenarios of `features/composition/composition.feature`: "chooses what the focus is made of", "structural navigation is in force from {string}", "structural navigation is in force and the focus is {string}", "structural navigation is in force and the focus is the molecule type of {string}", "focuses the molecule type of {string}", "inspects the position of an atom", "scales in past the minimum scale of {string}", and the Then steps: structural or spatial navigation in force, the mode change announced (live region text and the on-screen notice), "{string} is labelled a representative substance of {string}", the relationship's status `illustrative`, atom types with counts and source records, the molecular frame named and no orbit track, the scale at the minimum with the offer shown

### Ingest for User Story 5

- [ ] T078 [US5] Write `ingest/sources/pubchem.ts`: CID 962 `record/JSON?record_type=3d` and `record/JSON`, the element records for H and O, under five requests per second, raw kept, the exact URLs recorded in the manifest (R7 verify), citation line copied
- [ ] T079 [US5] Write `ingest/curate/molecules.ts`: entities `atlas:water` (`Substance`, name with the PubChem record as source), `atlas:pubchem-962` (`MoleculeType`, IUPAC name, formula observation), `atlas:element-h` and `atlas:element-o` (`AtomType`, atomic number observations); relations `atlas:earth representativeOf atlas:water` (`illustrative`, no evidence), `composedOf` (`observed`), `hasPart` with counts 2 and 1 (`observed`, the conformer atom list as evidence); the `Conformer` into `molecules.json`; run `just ingest` for pubchem and commit

### Surface for User Story 5

- [ ] T080 [P] [US5] Write `app/src/projections/conformer-plane.ts`: best-fit plane of the conformer's atoms, orthographic projection onto it, Å to pixels through a typed `Quantity<'angstrom'>` scale, `flattens` naming the out-of-plane axis of the conformer's frame (null distortion for a planar molecule, still declared as the conformer's frame)
- [ ] T081 [P] [US5] Write `app/src/renderers/composition.ts`: for the molecular regime, the substance view (water labelled "representative substance of Earth" with the illustrative status mark), the molecule view (atom-type discs with element symbols, bonds as physical lines, counts beside each type), the atom-type view (the element with its atomic number and source); never an orbit track, never a disc sized by anything astronomical
- [ ] T082 [US5] Finish `app/src/ui/made-of.ts` (enabled; dispatches `enterStructural`; `m`), write `app/src/ui/announcer.ts` (the `aria-live` region plus an on-screen notice: "a different kind of step: what Earth is made of", and on the way back "back to where Earth is"), and extend `app/src/renderers/representation.ts` so structural mode draws through the conformer plane and `back` out of the branch returns to the spatial scene with the announcement (FR-015, FR-015a)
- [ ] T083 [US5] Extend `app/src/model/release.ts` for `molecules.json`, make T076 pass, then make the six `composition.feature` scenarios pass; add the molecule view to the visual baselines

**Checkpoint**: both kinds of relationship exist and the interface says so.

---

## Phase 8: User Story 6 - Use it with a keyboard and without motion (Priority: P6)

**Goal**: every action by keyboard with the same outcome; reduced motion makes every transition
a cut and the chapter cue static; no status by colour alone.

**Independent Test**: complete the journeys of US1 to US5 with the keyboard only; repeat with
reduced motion and see no animated transition; `features/navigation/access.feature` passes.

- [ ] T084 [P] [US6] Write `tests/features/steps/access.steps.ts` for the three scenarios of `features/navigation/access.feature`: "the person scales, pans, selects, focuses, goes back, changes the date and inspects by keyboard" (each action by key, the resulting state compared with the same action by pointer from the same start), "the device asks for reduced motion" (`emulateMedia({ reducedMotion: 'reduce' })`), "the transition is a cut" (no intermediate fade value observed across frames), "the chapter cue is shown without movement", "inspects every status mark and every legend entry" and "each status is conveyed by a shape or a label as well as a colour" (through the mark registry and the legend's DOM)
- [ ] T085 [US6] Keyboard pass over every control in `app/src/ui/*.ts`: every control an HTML element with a visible focus ring (tokens), an accessible name, Tab order lock-up → scale rail → time → breadcrumb → search → inspector → legend; arrows move the selection among visible marks in reading order; the canvas keeps `role="img"` and an `aria-label` that names the focus and the regime; document the full map in `app/src/input/keyboard.ts`'s header
- [ ] T086 [US6] Reduced-motion pass over every remaining transition not covered by T063 and T064: focus moves in the structural branch, the inspector and legend panels, the time controller's play indicator; a single `app/src/ui/motion.ts` reads `matchMedia('(prefers-reduced-motion: reduce)')` once and every animated thing asks it; verified by T084
- [ ] T087 [P] [US6] Contrast and colour-alone check: a unit test `tests/navigation/contrast.test.ts` computing WCAG AA contrast of every token pair used for text in `app/src/styles/tokens.css` and `controls.css`, and asserting every status, regime band and legend entry carries a shape or a word (SC-007, FR-013)
- [ ] T088 [US6] Make `access.feature` 3 of 3 pass

**Checkpoint**: all journeys keyboard-only; reduced motion honoured (SC-007).

---

## Phase 9: User Story 7 - Find a known thing by name (Priority: P7)

**Goal**: a known name moves the focus to that entity in its context; a shared name offers each
entity with its kind, proved on the test release "shared-names".

**Independent Test**: search Mars, Proxima Centauri and water and arrive in the planetary, nearby
stellar and molecular regimes; on the test release search Mercury and be offered two with their
kinds; `features/navigation/search.feature` passes.

- [ ] T089 [P] [US7] Write `tests/features/steps/search.steps.ts` for the two scenarios of `features/navigation/search.feature`: "searches {string}", "two entities share the name {string}" (asserted against the open release), "each entity is offered with its kind", "the focus is unchanged"
- [ ] T090 [P] [US7] Write `tests/scientific/search.test.ts`: canonical names and aliases match case-insensitively and by prefix; a single match returns the id; several return candidates with kind; no match returns none
- [ ] T091 [US7] Write `app/src/model/search.ts` (makes T090 pass) and `app/src/ui/search.ts` (`/`; a field with a result list of canonical name and kind; Enter on one dispatches `focus` to it, which the transitions resolve to the entity's regime: planetary for a body, nearby stellar for a star, molecular with `mode: 'structural'` for a substance, molecule type or atom type)
- [ ] T092 [US7] Write `data/manifests/shared-names.yaml` and `data/curated/shared-names/` by a script `ingest/test-release.ts` that derives a minimal release from 001-prototype's curated files plus a second entity named "Mercury" of a different kind (an `AtomType` with a transcribed source record, `illustrative` for anything it cannot cite), marked `test_release: true` in the manifest so the application shows "test release" and `release.ts` refuses to serve it outside `?test`
- [ ] T093 [US7] Make `search.feature` 2 of 2 pass (the outline on 001-prototype, the shared-name scenario on `shared-names`)

**Checkpoint**: all 47 scenarios pass; `just check` green.

---

## Phase 10: Polish and cross-cutting

- [ ] T094 [P] Write `tests/performance/run.ts`: Playwright with CDP tracing against `dist/`, reporting frame-time percentiles at each standard scale and through the transition, visible mark count, input-to-paint for scale and select, release load time, heap growth over ten minutes; write results to `tests/performance/results/<date>.json` and the summary into `research.md`'s measurements section; fill the test machine in `tests/performance/README.md` (SC-008, R15)
- [ ] T095 [P] Update `docs/data-contracts.md`: the Gaia cut at 10 pc with R3's query, the `Kind` list of `data-model.md`, Hipparcos-2 and SIMBAD in the sources table, distance as derived with an interval; update `README.md`'s Status paragraph and Running table (`just rebuild`, `features`, `visual`, `perf`)
- [ ] T096 [P] Add the "Verify at implementation" outcomes and the "Found during implementation" section to `specs/001-earth/research.md`: the Gaia row count and removed stars, the cross-matched list, whether Halley lacked a radius (and if not, the test-release fallback taken), the PubChem URLs, the licence wording source pages, the scale defaults after the first screen, the test machine
- [ ] T097 Review every label, chapter cue, legend entry and inspector string in `app/src/ui/` and `app/src/renderers/` against the source it rests on, in a checklist under `specs/001-earth/checklists/claims.md` (string, where shown, source record or "not a claim"); every unsupported claim is reworded or removed; the count found is recorded in `research.md`'s measurements (SC-010)
- [ ] T098 Run `quickstart.md` end to end on a clean clone (`npm ci`, `just rebuild`, `npm test`, `just check`, `npm run build`, `npm run features`, `npm run visual`, `npm run perf`) and fix what fails; record the run in `research.md`
- [ ] T099 Write `decisions/0007-...md` only if implementation changed a contract or a plan decision (otherwise skip and say so in the PR); add the dated trap entries to `CLAUDE.md`'s Traps section for anything that cost time
- [ ] T100 Open the draft PR from `001-earth` to `main` with the spec's path, the tick count, the commands run and their results, the contracts touched, and the Claude Code trailer; it stays a draft until CI is green; Trevor merges

---

## Dependencies and execution order

- **Phase 1 → Phase 2 → stories.** Phase 2 blocks every story.
- **US1 (P1)** needs only Phase 2. It carries the Solar System ingest (T037 to T041), which US2
  and US3 reuse.
- **US2 (P2)** needs US1's ephemeris (T042) and surface (T046, T047).
- **US3 (P3)** needs US1's projection and representation (T044, T045) and the resolver. Its ingest
  (T058 to T061) is independent of US1's and can run in parallel with US1's surface work.
- **US4 (P4)** needs US1 to US3's data to inspect; its release steps (T069, T074) need every
  source landed, so T074 is the last ingest task. Two `neighbourhood.feature` scenarios complete
  here (T075).
- **US5 (P5)** needs Phase 2, US1's `made-of` offer (T049) and US4's inspector for the atom's
  source (T070); its ingest (T078, T079) can land any time after T024.
- **US6 (P6)** needs every control to exist: after US5 (or after US4 if US5 is deferred).
- **US7 (P7)** needs the navigation transitions and all three regimes: after US5 (or US4).
- **Polish** after the stories kept.

### Parallel opportunities

- Phase 1: T003 to T007 together after T002.
- Phase 2: T009 to T012 (tests) together; T015, T016, T018, T019 together after T014 and T017;
  T022, T023 together; T026, T027 together; T029, T030, T031 together.
- US1: T034 to T036 together; T037 to T039 together; T043, T044 together after T042; T047, T048
  together after T046.
- US3: T055 to T057 together; T058 to T060 together; T064, T065 together after T063.
- US4: T068, T069 together; T071 beside T070.
- US5: T076, T077 together; T080, T081 together after T079.
- Polish: T094 to T096 together.

### Parallel example: User Story 3

```text
Tests first:      T055 parallax.test.ts | T056 stars.test.ts | T057 neighbourhood.steps.ts
Ingest sources:   T058 gaia.ts | T059 hipparcos2.ts | T060 simbad.ts
Then:             T061 curate/stars.ts → T062 parallax.ts → T063 representation
Then:             T064 points.ts + chapter-cue.ts | T065 legend.ts + scale-rail.ts
Then:             T066 metadata → T067 scenarios and identity test
```

## Implementation strategy

**MVP**: Phases 1, 2 and 3. The first screen with a real, navigable, time-correct Solar System
and fidelity proved against Horizons: the brief's days 1 to 6.

**Increments**: US2 (time), then US3 (the signature transition), then US4 (evidence and the
reproducible release) complete the protected outward journey. US5 adds the structural branch,
US6 the keyboard and reduced-motion pass, US7 search. Each story ends with its feature file green
and its visual baselines approved, so the atlas is demonstrable after every phase.

**If time runs short**: stop after US4, then US6 (keyboard and reduced motion are properties of
the controls that exist, not a later tier), and defer US5 and US7 with their tasks unticked; never
shortcut the structural branch into a zoom.
