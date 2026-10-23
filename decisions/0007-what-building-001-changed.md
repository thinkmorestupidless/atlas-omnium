# 0007: What building 001 changed in its plan: the held-out epochs, the transition band, the star file

*2026-10-23.* Accepted.

## Decision
Three choices of the 001 plan were changed while it was built. None changes what the atlas promises
a person; each changes the letter of a contract or a plan decision, so each is fixed here.

1. **The held-out epochs are fetched at grid midpoints, not withheld from the samples.** The
   fidelity tier compares the interpolation against Horizons at the midpoints of sampling intervals,
   at least fifty per body, with two epochs shared by every body. `contracts/curated-files.md`
   said ingest withholds every 97th sample.
2. **The transition band starts at 1 × 10¹² m/px, not 3 × 10¹¹.** Its geometric midpoint, where
   reduced motion cuts, is therefore 5 × 10¹² rather than 3 × 10¹². Research R9 gave the earlier
   values as defaults to be tested.
3. **The star sample and its cross-match records are one file, and stars' positions are derived on
   load.** `stars.json` holds `{ sample, crossMatches }`. The contract listed `cross-matches.json`
   apart, and positions written at ingest.

## Why
1. A withheld sample leaves a gap twice the step, so the interpolation is tested where it never
   runs. A midpoint is the furthest point from any sample in the real grid, which is the honest
   worst case for the precision the atlas states.
2. At 3 × 10¹¹ m/px the Sun is still visibly off-centre in an Earth-centred view, so it would move
   across the band as the discs fade and its identity would look like a jump. From 1 × 10¹² it is
   within 0.15 px of the centre.
3. A star's position is a derived state: it names its model, inverse parallax, and its inputs.
   Writing it at ingest would store it as if observed. The loader expects one file, and splitting it
   bought nothing.

## Alternatives
Keep the contract's letter and accept the weaker test, the moving Sun, and positions stored as
data. Each was tried or weighed in `specs/001-earth/research.md` under "Found during
implementation", which keeps the details.

## Consequences
`contracts/curated-files.md` now says what was built. The scale-rail band and the reduced-motion
cut follow the resolver's `BAND`, so a later change to the band is one constant and this record.
The sessions may still move the band; the reason for its inner edge stays.
