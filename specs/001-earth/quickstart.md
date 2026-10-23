# Quickstart: proving 001 earth

How to run the feature and see that it does what the spec says. Commands are the repository's;
expected outcomes are the spec's scenarios. Implementation detail is in `tasks.md`.

## Prerequisites

- Node 24 or later; `npm ci`.
- `uv` for the feature checker (`just check`).
- Network only for `just ingest`, once; nothing else needs it.
- Playwright browsers: `npx playwright install chromium` (first time).

## Build the release

```bash
just ingest        # acquires every source named in data/manifests/001-prototype.yaml, fills it
just rebuild       # rebuilds data/curated/001-prototype/ from data/raw/ without the network
```

Expected: the manifest ends with `reproducible: true`, every `null` gone;
`data/curated/001-prototype/validation-report.json` lists the star count, the stars the cuts
removed, each cross-matched star with its basis, and the measured precision per body. `just
rebuild` reproduces every curated checksum (release feature, SC-009). A manifest with a `null`
left in it makes `just rebuild` exit non-zero naming the field.

## Run the suites

```bash
npm test           # scientific and navigation tiers, vitest
just check         # features, glossary and spec consistency
npm run build      # type-check and build dist/
npm run features   # the living features end to end, playwright-bdd against the preview of dist/
npm run visual     # screenshots at the standard scales against approved baselines
npm run perf       # frame-time percentiles, mark count, load time, heap growth against dist/
```

Expected: the scientific tier shows every supported body within the stated precision at every
held-out epoch (SC-002), `null` surviving every layer (SC-006), an unknown frame rejected; the
navigation tier shows the selection unchanged across the transition (SC-004); every scenario in
`features/` passes (47 at planning), including the ones against the test release `shared-names`.

## See it

```bash
npm run dev
```

Walk the spec's journey and compare with the scenarios:

1. Open: Earth selected and focused on the cream canvas, the lock-up, scale rail and time
   controller; the Moon out of view (`explore.feature`).
2. Scale out: the Moon in Earth's context; further, the Sun, eight tracks and planets.
3. Change the date to 2030-01-01: every body moves; the epoch reads 2030-01-01 in its time scale
   (`time.feature`). Try 2100-01-01: refused with the window shown.
4. Select Mars, press `i`: the inspector shows the distance from the Sun with unit, the Horizons
   record, DE release, epoch, frame, and the attribution line (`inspector.feature`).
5. Select the Sun, scale out past Neptune: tracks fade, the Sun stays put and stays selected, the
   stars appear; the scale rail declares the flattened dimension (`neighbourhood.feature`).
6. Select Proxima Centauri: distance as a range from its parallax, the parallax record and the
   model in the inspector. Select Alpha Centauri A: a cross-match record with both records and
   the basis.
7. Go back to Earth, choose "what is it made of?": the mode change is announced; water is a
   representative substance; the molecule shows H×2 and O×1 in the conformer's frame, no orbit
   track; back returns to Earth in spatial navigation, announced (`composition.feature`).
8. Repeat 1 to 7 with the keyboard only, then with reduced motion on (`access.feature`).

## What is not proved here

Usability (SC-001, SC-005) is measured in the sessions `docs/evaluation.md` describes, not by a
command. SC-008 is measured by `npm run perf` on the machine named in
`tests/performance/README.md`.
