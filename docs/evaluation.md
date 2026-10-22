# Evaluation

What 001 earth must do to be accepted, how it is tested, and what is measured in the usability
sessions. The decision gate at the end decides whether coverage grows or the interaction model
iterates first.

## The journey

1. Open: Earth selected on a cream canvas; the lock-up, a few quiet labels, the scale rail and the
   time control.
2. Scale out: the Moon appears in Earth's context; further out, the heliocentric view with orbit
   tracks.
3. Change the time: the planets move to their evaluated positions; the epoch is visible.
4. Select Mars: the focus moves smoothly; the metadata names the source and the frame.
5. Continue out: the orbital geometry recedes, the Sun becomes a stellar point, the sample stars
   appear.
6. Select a nearby star: the view moves to it in the current projection; no invented planets.
7. Return to Earth by history. Choose "what is it made of?" and enter the explicitly structural
   water and molecule branch.
8. Inspect the source and status of a displayed fact.

## Acceptance

- Every displayed object has a stable atlas id and a source reference, or an explicit illustrative
  classification.
- Earth to Solar System to nearby stars and back is navigable without leaving the primary
  experience.
- Planetary positions update for a chosen valid time and agree with the frozen reference
  ephemerides within the stated precision.
- The selection survives every regime transition.
- A user can tell a real distance from an illustrative size exaggeration.
- At least one inward composition path is navigable and clearly a different relation from spatial
  position.
- Epoch, frame, units and uncertainty or missing-value information are inspectable.
- No factual value silently defaults when absent.
- Mouse and keyboard both work; reduced motion is supported.
- The demo uses fixed source snapshots and is reproducible from the manifest.

## Test tiers

| Tier | Where | Runs | Proves |
|---|---|---|---|
| Model and conversions | `tests/scientific/` | `npm test`, every push | unit conversions against reference values; an unknown frame is rejected; a null stays null through every layer |
| Ephemeris fidelity | `tests/scientific/` with `tests/fixtures/horizons-reference.json` | every push | positions evaluated at held-out epochs agree with Horizons within the stated tolerance for every supported body, across the window |
| Catalogue fidelity | `tests/scientific/` | every push | Gaia rows convert to ICRS Cartesian with correctly propagated distance uncertainty; the sample matches the manifest's query and count |
| Navigation | `tests/navigation/` | every push | state transitions, history, regime resolution with hysteresis, identity across regimes, mode announcement on a structural edge |
| Features | `features/`, through a browser harness | every push once the first screen exists | the living scenarios the spec names, end to end |
| Visual | `tests/visual/` (Playwright) | on demand and before a usability session | screenshots at the standard scales compared against approved baselines; label collisions and vanished marks counted |
| Performance | a script against `dist/` | before a usability session | the measures below, on the stated machine |

The scientific tier is written before the renderer. The spec's "correct positions at known
epochs" on days 4 to 6 means this tier is green, not that the screen looks right.

## Measures

**Interaction.** Time and assistance to: find Mars; reach another star; return to Earth; find what
water is made of. Count wrong selections, reversals and incorrect mental models, and ask whether
the mode change at the structural edge was noticed.

**Scientific fidelity.** Source-record coverage (displayed values with a source over displayed
values); position error against the reference at held-out epochs; unit tests passing; invalid
frames rejected; uncertainty shown correctly; unsupported claims found in review (target zero).

**Performance.** On a stated test machine: frame time distribution at each standard scale and
during the transition; visible mark count; input-to-response delay; scene load time; memory
growth over a ten-minute session. The Canvas 2D backend is replaced when the 95th percentile
frame time exceeds 16 ms at a mark count the next regime needs.

**Visual.** Screenshot comparison at the standard scales; label collisions; marks lost at a
regime boundary; colour contrast against WCAG AA; whether the grammar is understood without
training in the sessions.

## Decision gate

Proceed to larger coverage when independent users complete the core journeys, the scientific
contracts hold and the transition is compelling. Otherwise iterate the interaction model before
scaling the data pipeline. If time runs short, protect the outward journey and data fidelity and
defer the inward branch rather than shortcut it.
