# Claims checklist: 001 earth

Every string the atlas shows a person, checked against what it rests on (T097, SC-010). A string
is a claim when it says something about the world or about how the atlas knows it. "Not a claim"
covers controls, names of regimes and words that describe the drawing itself. Strings built from
data name the field they read; the data's own provenance is the inspector's.

**Found: 4 unsupported claims, all reworded.** They are marked "reworded" below.

## The lock-up and the page

- [x] "Atlas Omnium." and "Every place. Every scale. Everything we know." · lock-up · not a claim: the product's name and promise, kept with their full stops.
- [x] "Release … is not reproducible yet (… is unfilled), so the atlas will not show it." · problem notice · the manifest's first null field (`firstUnfilled`).
- [x] "test release …" · banner · the manifest's `test_release`.
- [x] "The atlas scene: … in focus, the … regime, … navigation" · canvas label · the navigation state.

## The legend (app/src/ui/legend.ts)

- [x] "a disc: a body at its measured radius, or drawn larger, with the factor labelled" · legend · the resolver: true radius from the fact sheet, or `MIN_DISC_PX` with the factor.
- [x] "a point: a body whose radius is missing" · legend · the resolver's `radiusMissing`; Ceres and Halley.
- [x] "an orbit track: the orbit from JPL's approximate elements; the Moon's from its own positions over a month" · legend · **reworded**: it said "from its elements", which the Moon's track is not (`moonLoop`).
- [x] "the Sun: drawn at the size of the brightest band; no catalogue in the sample gives its magnitude" · legend · **reworded**: it said "the largest stellar mark", but the brightest band is the same size.
- [x] "a star, magnitude … (Gaia G, or Hipparcos Hp)" and "a star fainter than magnitude 14, or with no magnitude" · legend · `STAR_BANDS`, and the observations `gMagnitude` and `hpMagnitude`.
- [x] "a dashed ring: the distance range, where it spans half a pixel or more" · legend · **reworded**: it said "a pixel", but `RANGE_RING_MIN_PX` is 0.5.
- [x] "a tick: the height above (up) or below (down) the ecliptic, which the view flattens" · legend · the projection's flattened coordinate; up on screen for a positive height.
- [x] "a substance or a molecule type: a glyph of one size, which says nothing about its size" · legend · `SUBSTANCE_PX`; no source gives a size.
- [x] "an atom: its element's symbol in a glyph of one size; bonds are physical lines" · legend · `ATOM_PX`; the symbol is the PubChem periodic table's.
- [x] "the molecule seen face-on to its best-fit plane: distance from it is flattened" · legend and molecule view · the conformer projection; a statement about the drawing.
- [x] "observed", "derived", "inferred", "illustrative" · legend · the four statuses of R11.
- [x] Selection, focus and the three line vocabularies · legend · not a claim: they describe the drawing.
- [x] The star sample's criteria, catalogue release and count · legend · the Gaia manifest entry's query and release, and the curated `stars.json`.

## The scene

- [x] Body and star names · labels · each entity's canonical name and its source record.
- [x] "… · exaggerated ×N" · label · the resolver's factor, measured radius against the drawn one.
- [x] "… · illustrative" · label · an entity with no source record; none in 001-prototype.
- [x] "nearby stars", "the Solar System" · chapter cue and scale rail · not a claim: regime names.
- [x] "1 px = …" · scale rail · the scale, converted by `readableDistance`.
- [x] "seen from above the ecliptic: height above it is flattened" · scale rail · the projection's `flattens` words.
- [x] "water · representative substance of Earth" · substance view · the `representativeOf` relationship, status illustrative.
- [x] "oxidane · H2O · molecule type" · substance view · PubChem's preferred IUPAC name and molecular formula for CID 962.
- [x] "H hydrogen × 2", "O oxygen × 1" · molecule view · the `hasPart` counts, from the conformer's atom list.
- [x] "… · atomic number N" · atom-type view · the `atomicNumber` observation from the periodic table.

## The metadata and the inspector

- [x] Values with units and source lines · metadata and inspector · each observation's value, unit and source record.
- [x] "derived · … · by hermite-state-vectors, stated precision X km" · metadata · the derived state's model and the curated `precision.json`, the largest error at the held-out epochs. "Stated precision" is the glossary's term for that measured error.
- [x] "exaggerated ×N larger than measured" with "the distance is true" · metadata · the resolver; positions are never moved.
- [x] "a point: the radius is missing" · metadata · the observation's null value.
- [x] Relationship lines with their status marks · metadata · each relationship's predicate, target and status.
- [x] "representative substance of Earth" · metadata of water · the incoming `representativeOf` relationship.
- [x] Distance range, inverse parallax and the cross-match lines · metadata and inspector · `INVERSE_PARALLAX`, the parallax observation and the cross-match record.
- [x] "none: it is shown for understanding, not asserted" · inspector · an illustrative relationship with no evidence.
- [x] "yes: rebuilt from its manifest and raw snapshots to the recorded checksums" · release view · `reproducible: true`, which `ingest/rebuild.ts` checks.
- [x] "a test release: derived from 001-prototype by ingest/test-release.ts, for the suites only" · release view · **reworded**: a test release showed the rebuild sentence, which `ingest/rebuild.ts` does not check for it.
- [x] Licence, attribution and citations · release view · copied verbatim into the manifest from each source's terms pages.
- [x] "the molecular frame of pubchem CID 962, 3D conformer …" · inspector · the conformer's source record.

## The controls

- [x] "supported window … to …" and the refusal sentence · time controller · the manifest's window.
- [x] "positions at … UTC · JD … TDB" · time controller · the date converted by `model/time.ts`.
- [x] "one day per second" and the other rates · time controller · not a claim: the rate chosen.
- [x] "what is Earth made of?" with "a different kind of step (m)" · made-of offer · not a claim: a control.
- [x] "a different kind of step: what Earth is made of", "back to where Earth is" · announcer · not a claim: the mode change.
- [x] "nothing in this release is called …" · search · the search over the open release.
- [x] Kind words ("planet", "atom type" and the rest) · metadata and search · each entity's kind.
