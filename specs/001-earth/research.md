# Research: 001 earth

*2026-10-23.* Phase 0 of the plan. Each entry resolves a point the spec, the design documents or
the clarifications left to the plan, as a decision, its rationale and the alternatives. Where a
fact about a source can only be known by querying it, the entry says so and names the task that
verifies it at ingest; nothing here is asserted about a catalogue that was not checked.

## R1. Horizons sampling: step per body, bounded Hermite error, chunked requests

**Decision.** State vectors from the Horizons API (`format=json`, `EPHEM_TYPE=VECTORS`,
`CENTER='500@10'` for the planets and small bodies, `'500@399'` for the Moon, `REF_PLANE=ECLIPTIC`,
`REF_SYSTEM=ICRF`, `VEC_TABLE=2` for position and velocity, `OUT_UNITS=KM-S`, `TIME_TYPE=TDB`,
`CSV_FORMAT=YES`) sampled over 2000-01-01 to 2050-12-31 TDB at a step per body chosen so the
cubic Hermite interpolation error bound `r · ω⁴ · h⁴ / 384`, taken at perihelion, is under the
stated tolerance: 100 km for a heliocentric body, 10 km for the Moon.

| Body | Step | Bound | Rows |
|---|---|---|---|
| Mercury | 1 d | 18 km | 18,627 |
| Venus, Earth | 4 d | 46 km, 10 km | 4,656 |
| Mars | 8 d | 33 km | 2,328 |
| Jupiter, Saturn, Uranus, Neptune | 32 d | under 14 km | 582 |
| Moon, geocentric | 1 d | 4.2 km | 18,627 |
| Ceres | 16 d | 24 km | 1,164 |
| Pluto | 32 d | under 1 km | 582 |
| 1P/Halley | 2 d | 30 km | 9,313 |

About 60,000 rows and 5 MB of JSON before compression, one file per body, fetched in parallel at
start. The **stated precision** the atlas shows (FR-006) is the measured maximum error against the
held-out epochs, per body, written into the release by ingest, never the bound above. Requests are
chunked by calendar year so no single response approaches Horizons' output limit; the raw
responses are kept per chunk and concatenated at curation.

**Horizons reports the ephemeris version in the result header** (`{source: DE441}` or the
satellite ephemeris for the Moon); ingest parses it into the manifest's `source_release`. The JSON
wrapper carries `signature.version`; ingest refuses a version it was not written against.

**Rationale.** Decision 0004 chose vectors plus Hermite; what it left to the plan is the step and
the tolerance. A single ten-day step would give Mercury a 39,000 km bound and the Moon far worse;
a step per body keeps the error two orders of magnitude under a pixel at every scale while the data
stays small enough to commit. The velocities Horizons gives make Hermite exact to fourth order at
no extra cost.

**Alternatives.** Chebyshev coefficients (as SPICE kernels store them): smaller and more accurate,
but a fitting step in ingest and a less legible curated file; deferred to a later release if the
size bites. A uniform step: rejected above. Requesting positions at display time: excluded by the
no-network rule.

## R2. Civil date to TDB: typed, with a stated leap-second assumption

**Decision.** The time controller holds a civil date in UTC. The epoch for evaluation is
`JD_TDB = JD_UTC + (ΔAT + 32.184 s) / 86400`, with ΔAT from a table of leap seconds (37 s from
2017-01-01) and TDB − TT neglected, which is under 2 ms. The conversion is one function in
`app/src/model/time.ts`, tested against IERS reference values, and the neglect is written in its
doc comment and the inspector's time-scale note. The window ends in 2050; no leap second is
announced beyond 2017, and the CGPM has resolved to end them by 2035, so the table is exact for
the window until a leap second is announced, which would be a new release.

**Rationale.** The spec requires the epoch in its time scale; the conversion is seconds and must
be typed, not ignored. **Alternatives.** Treat the date as TDB directly: a 69-second error at every
epoch, invisible on screen and dishonest in the inspector.

## R3. The star sample: Gaia DR3 within 10 pc, quality cuts shown

**Decision.** The ADQL, verbatim in the manifest:

```sql
SELECT source_id, ra, dec, parallax, parallax_error, pmra, pmdec, pmra_error, pmdec_error,
       radial_velocity, radial_velocity_error, phot_g_mean_mag, bp_rp, ruwe, ref_epoch
FROM gaiadr3.gaia_source
WHERE parallax > 100 AND parallax_over_error > 10 AND ruwe < 1.4
```

against the Gaia archive TAP sync endpoint. The selection criteria shown in the legend are
exactly these three cuts and the catalogue release, in words. Distance is derived from parallax
(clarification Q4): `d = 1000 / ϖ` pc with status `derived`, model `inverse-parallax`, and its
uncertainty the interval `[1000/(ϖ+σ), 1000/(ϖ−σ)]`. No zero-point correction is applied in 001
and the model says so; the sample's parallaxes are all over 100 mas, where the correction of a few
tens of µas is under one part in a thousand.

**Rationale.** The spec's assumption is roughly 10 pc; the brief wants dozens to hundreds of stars.
Within 10 pc Gaia DR3 holds on the order of two to three hundred sources after the cuts, which is
a legible point cloud. The cuts are the archive's own recommended quality filters. **Verified at
ingest** (task): the row count, Proxima Centauri's presence (`source_id 5853498713190525696`), and
which stars within 10 pc the cuts removed, listed in the validation report.

**Alternatives.** 20 pc (`parallax > 50`, as `docs/data-contracts.md` sketched): thousands of
rows, more than Canvas 2D needs to prove and more than a legend can explain. Bailer-Jones
geometric distances: better for distant stars, unnecessary at parallax over 100 mas, and a second
model to explain.

## R4. The brightest stars: Hipparcos-2 through cross-match records, names from SIMBAD

**Decision.** The second catalogue is **Hipparcos, the New Reduction** (van Leeuwen 2007, VizieR
`I/311/hip2`) queried through the VizieR TAP service for every star with `Plx > 100`. A Hipparcos-2
star is a candidate for the sample only if it is absent from the Gaia result and absent from the
archive's `gaiadr3.hipparcos2_best_neighbour` table for its HIP number; that absence is recorded.
Each such star enters through a **cross-match record** carrying the Hipparcos-2 record, the
SIMBAD identifier record that ties the HIP number to the star's names, and the basis
`published-cross-identification`; `gaiaDr3` is `null` in the record and the inspector shows it.
A star that is in both catalogues enters from Gaia only; Hipparcos-2 is not merged into it in 001.

**Names for every star come from SIMBAD** (TAP, `basic` joined to `ident`), queried by Gaia DR3
`source_id` or HIP number, with the retrieval recorded as a source. A star with no common name
shows its catalogue identifier as its canonical name. The expected members by this route are
Sirius A, Alpha Centauri A and B, Procyon A, Altair, Vega and Fomalhaut; **the list is produced by
ingest, not typed in**, and the validation report names each with its basis.

**Rationale.** The search found that the brightest Hipparcos stars have no Gaia EDR3 counterpart
through saturation, Sirius and α Centauri AB named among them, and no DR3 source saying otherwise;
the plan treats that as expected and makes ingest prove it star by star. Hipparcos-2 is the only
all-sky astrometric catalogue of those stars with published uncertainties. SIMBAD is needed anyway:
Gaia carries no names, and a displayed name is a displayed value with a source. **Alternatives.**
Typing the seven stars in by hand: forbidden by FR-008a. Taking everything from SIMBAD's
parallaxes: SIMBAD's values are themselves copies; the record would not be the measurement.

## R5. Radii and physical properties: NASA fact sheets, hand-transcribed with row citations

**Decision.** Mean radius and mass for the Sun, the planets, the Moon and Pluto from the NSSDCA
planetary fact sheets, transcribed into `data/curated/properties.json` by a script in ingest that
embeds the values, the page URL, the row label and the retrieval date, so every value cites a row.
Ceres from the asteroid fact sheet. **1P/Halley is the body expected to have no mean radius in
these sources**; if ingest finds every curated body has one, the "radius missing" scenario runs
against a test release, as the search scenario does (clarification Q6), and the spec's assumption
is amended. A star has no radius in 001: `null`, shown as missing.

**Rationale.** Decision 0003's "hand-transcribed with the page and retrieval date as the source
record". **Alternatives.** Horizons' physical-parameter header: present for the planets but
unstructured and not present for every body; a second parser for the same numbers.

## R6. Orbit tracks: JPL approximate Keplerian elements, labelled as a model

**Decision.** The planets' tracks are drawn from the JPL "Keplerian elements for approximate
positions of the major planets" table valid 1800 to 2050, transcribed with its page as the source
record; the Moon's geocentric track from its mean elements on the same basis; Ceres, Pluto and
Halley from Horizons osculating elements (`EPHEM_TYPE=ELEMENTS`) at J2000 with the epoch
recorded. Every track is a `derived` curve with status and validity shown in the inspector and is
never the authority for a body's position (decision 0004).

## R7. Molecules: PubChem PUG REST, 3D conformer of CID 962

**Decision.** `GET /rest/pug/compound/cid/962/record/JSON?record_type=3d` for the water
conformer (atoms with element numbers, coordinates, bonds) and `/record/JSON` for the 2D record and
IUPAC name; the element records for H (atomic number 1) and O (8) from the periodic-table resource
or, if that endpoint is unstable, the compound records of CID 783 and CID 977 with the element as
the atom type's source. PubChem data carries no licence restriction and asks for citation; the
manifest records the citation line. Requests stay under PubChem's stated limit of five per second.
The docs page was behind a browser check at research time; **the exact URLs are verified at
ingest** and recorded verbatim in the manifest.

**The structural layout** projects the conformer onto its own best-fit plane (water is planar, so
nothing is flattened; the projection is still declared as the conformer's frame). Bonds are
physical lines in the regime's ink; atom types are discs with their element symbol; counts from the
molecular formula, with the conformer's atom list as the source record.

## R8. Licences and attribution, recorded per source

| Source | Terms as understood at research | Shown as |
|---|---|---|
| JPL Horizons | public, no licence; courtesy credit "JPL Solar System Dynamics" | attribution line |
| NSSDCA fact sheets | US government work, public domain; credit requested | attribution line |
| Gaia DR3 | free to use with credit to ESA/Gaia/DPAC; cite the mission and DR3 papers; the archive's own terms page states the licence | attribution line and the two citations in the release view |
| Hipparcos-2 (VizieR) | CDS asks for the catalogue citation and "made use of the VizieR catalogue access tool" | attribution line |
| SIMBAD | CC BY 4.0; "This research has made use of the SIMBAD database, operated at CDS" | attribution line |
| PubChem | public; citation requested | attribution line |

The exact wording is copied from each source's page at ingest into the manifest's `licence` and
`attribution` fields and never paraphrased in the application. A third-party page describes Gaia
DR3 as CC BY-NC 3.0 IGO and could not be confirmed against ESA; ingest records what the archive's
terms page says on the day.

## R9. Scale, regimes and the transition band, in metres per pixel

**Decision.** Scale is one number, metres per pixel of CSS pixel size. Defaults, tested in the
sessions rather than decided for good:

| Point | Scale | What is on screen |
|---|---|---|
| minimum scale of Earth | Earth's disc at 90% of the shorter viewport side (about 1.4 × 10⁴ m/px on a 1000 px side) | the structural step is offered |
| opening | Earth at 120 px diameter, about 5 × 10⁴ m/px | the Moon, at 384,400 km, is 7,000 px away: out of view |
| Moon in view | about 1 × 10⁶ m/px | Earth's context |
| heliocentric | 1 × 10⁹ to 1 × 10¹¹ m/px | all eight tracks |
| transition band | 3 × 10¹¹ out to 3 × 10¹³ m/px | tracks thin then fade, discs before tracks, the Sun's disc becomes a point |
| nearby stellar | 1 × 10¹⁴ m/px and out | Proxima 400 px from the Sun at 10¹⁴; the whole 10 pc sample fits at 1 × 10¹⁵ |

Fading is a pure function of scale, so scaling back reverses it exactly. The renderer switch that
changes the active set happens at 1 × 10¹³ going out and 3 × 10¹² coming in (hysteresis). Reduced
motion cuts at the band's geometric midpoint, 3 × 10¹². The scale policy `exaggerated` applies
when a body's true disc would be under 3 px: it is drawn at 3 px, or at a size the legend's rule
gives, with the factor labelled; `true` draws the true size even when sub-pixel, as a 1 px point.

## R10. The projection plane and the flattened dimension

**Decision.** One projection from Earth orbit to the stars: the heliocentric ecliptic J2000 plane
seen from the north ecliptic pole, x to the right, y up, with the Sun at the origin in the
planetary regime and the same origin in the nearby stellar regime. Gaia ICRS positions are
converted to Cartesian (`ra`, `dec`, derived distance) and rotated into the ecliptic by the J2000
obliquity (84381.406″); the ecliptic z, the flattened dimension, is drawn as a height tick on each
star and declared on the scale rail. The projection is surface code (decision 0006): nothing in
the model or the navigation state names the plane.

## R11. Status marks and the legend

**Decision.** Four status marks, designed to differ in shape and read without colour: observed
a filled disc beside the value, derived a half-filled disc, inferred an open ring, illustrative a
dashed ring. The selection mark is a ring around the mark at a fixed offset; the focus mark is a
ring weight. Neither shares a shape with a status mark. The legend is opened by `l` and shown
once on first use. Whether regimes take dominant colours is left to the sessions: 001 ships with
one ink and the four panel colours reserved for the chapter cues and the legend, so that nothing
has to be unlearned if the sessions say no.

## R12. The feature harness: playwright-bdd on the living features

**Decision.** The living features under `features/` run end to end through
`playwright-bdd` (MIT; generates Playwright tests from the `.feature` files, supports Background,
Scenario Outline and tags) with step definitions under `tests/features/steps/`, against the Vite
preview of `dist/`. Scenarios that are not about the screen (`features/release/`) have steps that
run the ingest rebuild in Node. The visual tier reuses Playwright for screenshots. The checker
(`just check`) stays the static gate for the features' consistency; the harness is their proof.

**Rationale.** One runner for features and screenshots, native Playwright fixtures, and the
feature files stay the single source: no second copy of the scenarios. **Alternatives.** Cucumber.js
driving Playwright: a second runner and reporter beside Playwright's. vitest-cucumber: no browser.

## R13. Fonts are self-hosted

**Decision.** Bricolage Grotesque and IBM Plex Mono (both SIL Open Font Licence) are vendored as
woff2 under `app/public/fonts/` and loaded by `@font-face`; the Google Fonts links in
`app/index.html` are removed. The glossary's `network` term says the atlas calls no external
service while running; a font request is one.

## R14. Gamepad input is the next feature's

**Decision.** Decision 0006 allows gamepad in 001 if cheap. Binding the Gamepad API to the same
action bus is cheap; proving it is not, because Playwright cannot emulate a gamepad and the step
would need an injected `navigator.getGamepads`. 001 stays with pointer, keyboard and touch; the
input adapter is written so a gamepad adapter is one file. The next feature adds it with its
scenario.

## R15. Performance instrumentation

**Decision.** A `performance.measure` around each frame and each input-to-paint, read by a script
against `dist/` with Playwright's CDP tracing, reporting frame-time percentiles per standard scale
and during the transition, mark count, load time and heap growth over ten minutes. The stated test
machine is the one the sessions run on and is named in `tests/performance/README.md` when known;
SC-008 is measured there.

## Found during implementation

What building 001 showed that the decisions above did not say. None of it changes a contract's
promise to a person; where it changes a contract's letter, the entry says which.

### Time, frames and the reference ephemeris
- Horizons states its "Ecliptic of J2000.0" obliquity as 84381.448″ (IAU 1976) in every vectors
  response. The stars are rotated with the same value so both share one plane exactly.
- The Horizons API reports version 1.2. It is recorded in the manifest as `api_version`.
- T010's reference value was wrong. 2000-01-01T12:00 UTC is not JD 2451545.000800741 in TT: with
  TT − UTC of 64.184 s it is JD 2451545.000742870. The test instead checks J2000.0 from its defining
  instant, 2000-01-01T11:58:55.816 UTC, which is JD 2451545.0 in TT.
- `setDate` accepts a civil date or a full UTC instant ending in `Z`. The held-out epochs fall at
  fractional days, and the time scenario changes the date to one.

### The Solar System's data
- The held-out epochs are fetched from Horizons at the midpoints of grid intervals, not withheld
  from the sampled rows. `contracts/curated-files.md` says "withholds every 97th sample". The
  midpoints are a harder test, because they are the furthest points from any sample. The stride is
  per body, min(97, floor(intervals / 50)), so every body has at least 50. Two shared epochs, JD
  2461000.25 and 2466000.75, serve the scenario that compares every body at one epoch. Horizons
  answers 502 to a list of more than about 40 epochs, so the requests are batched.
- The sampling steps were shortened to follow each planet's motion about its system barycentre,
  which its moons cause. With the first steps the outer planets' errors were 223 to 4,790 km.
  The steps in days are now: 1 for Mercury, Jupiter and the Moon; 2 for Neptune, Pluto and
  Halley; 4 for Venus, Earth, Saturn and Uranus; 8 for Mars; 16 for Ceres. Every body's error is
  now under 100 km.
- Ceres's fact sheet gives three axes and no mean radius. Its radius is missing, not averaged.
- The Moon's orbit track is drawn from its own samples over one sidereal month around the epoch,
  not from elements.
- Orbit tracks fade in from 1 × 10⁸ to 2 × 10⁸ m/px. Below that, the approximate elements' error
  would show against the bodies' true positions.
- The curated release is about 13 MB and the raw snapshots about 21 MB.

### The nearby stars
- `stars.json` holds the `StarSample` and the cross-match records together, and the positions are
  derived when the release loads. `contracts/curated-files.md` lists a separate
  `cross-matches.json` and positions written at ingest. A position is a derived state and names its
  model, so it is computed, not stored as if observed.
- A Gaia DR3 parallax σ gives a distance range of [1000/(p + σ), 1000/(p − σ)] pc. Positions are at
  the catalogue's epoch (J2016.0 TCB for Gaia, J1991.25 for Hipparcos-2). 001 applies no proper
  motion, and the epoch is part of each position.
- The query of R3 returns 238 stars. Without the cuts there are 315, and every one of the 77 removed
  fails the RUWE cut. Proxima Centauri is in the sample.
- A Hipparcos-2 star enters through a cross-match record only when four checks all hold:
  - its HIP number has no row in `gaiadr3.hipparcos2_best_neighbour`;
  - SIMBAD lists no Gaia DR3 identifier for it;
  - no Gaia DR3 source within 10 pc, before or after the cuts, lies within 5″ of its position
    carried to J2016.0;
  - SIMBAD has a record for it.

  The third check keeps out Hipparcos entries for whole systems (70 Oph, HD 32450, CD-44 3045)
  whose components Gaia has and the cuts removed. Entering those would undo the cuts. Thirteen
  stars enter this way, among them Sirius, Procyon, Alpha Centauri A, Vega, Altair and Fomalhaut.
  The validation report gives the decision for every Hipparcos-2 star.
- Alpha Centauri B is not in the sample. Gaia DR3's best neighbour for HIP 71681, source
  5877748442128924544, is not among the sources with a parallax over 100 mas, so it fails the
  sample's bound. Hipparcos-2 cannot add it, because Gaia does not lack it. The validation report
  records this.
- A star's canonical name follows a fixed order:
  1. SIMBAD's main identifier, when it is a name.
  2. A Bayer designation with its component letter written out ("* alf Cen A" is "Alpha
     Centauri A").
  3. SIMBAD's shortest name.
  4. The main identifier.

  The epoch scale `TCB` and the property `hpMagnitude` were added to the schema for the Gaia and
  Hipparcos-2 records.
- The Gaia DR3 credit page answered 503 throughout acquisition, as the archive's documentation
  server was in maintenance. The acknowledgement and the two papers were copied from the Internet
  Archive's copy of the same page, taken on 2026-02-11. The manifest's `terms_pages` names that
  copy, and the source module reads the live page first. SIMBAD's licence (ODbL) is stated on its
  home page and copied from there.

### Water and the release as a whole
- PubChem was acquired during US4, not US5. T074 asks for a manifest with no unfilled field, and
  PubChem's entry is part of the manifest, so T078 and T079 were done first.
- PubChem's citation guidelines page sits behind a browser check. The page renders a markdown file,
  `/pcfe/docs/markdown/citation-guidelines.md`, and the citation is copied from that file.
  PubChem states no licence of its own. The licence quotes NCBI's website policies, which say US
  government work is public domain and ask that NLM be acknowledged. The record's attribution
  follows the guidelines' own form: "PubChem Identifier: CID 962. URL: …".
- The atom types come from PubChem's periodic table resource, the first choice of R7.
- The schema has no property for a molecular formula, because an observation's value is a number.
  The molecule type carries PubChem's molecular weight (18.015 g/mol) as an observation, and the
  formula H2O as an alias. Its canonical name is PubChem's preferred IUPAC name, "oxidane". The
  substance's canonical name is the traditional one, "water".
- The `hasPart` relationships rest on the conformer's atom list. Their evidence id is
  `conformer:atlas:pubchem-962`, which the inspector resolves to the conformer's source record.
- With PubChem in, the release rebuilds offline to all 21 checksums, and the manifest says
  `reproducible: true`. The feature harness and the visual tier no longer open the release with
  `allow-unreproducible`.

### The structural branch
- Marks in the molecular regime are glyphs of one fixed size. Their size says nothing about the
  thing, because no source in the release gives an atomic or molecular size.
- PubChem's periodic table names the elements with a capital, "Hydrogen" and "Oxygen". The atlas
  keeps the source's spelling as the canonical name. It shows the counts in lower case, in prose.
- The keyboard choice `m` enters structural navigation whenever the focus has a representative
  substance, not only at the minimum scale. The offer on screen still appears only at the minimum
  scale, as FR-015a asks. The step is never taken by scaling.
- The announcement names the body the branch leaves from: "a different kind of step: what Earth is
  made of" and, on the way back, "back to where Earth is".

### Access
- The keyboard and the pointer give the same outcome for scaling, panning, selecting, focusing,
  going back, changing the date and inspecting. The wheel's factor equals the key's step to the ninth
  digit, so the comparison holds the scale to six significant figures.
- At the planetary view the Moon's mark lies under Earth's, so only the keyboard can select it. The
  arrows move the selection among every visible mark, overlapping or not.
- Nothing in the controls animates. The panels, the play indicator and structural focus moves are
  cuts already, so T086 needed no change beyond a stylesheet guard and the one reader in `ui/motion.ts`.
- Every text colour meets WCAG AA on the backgrounds it is set on, and the focus ring meets 3:1. The
  unit test reads the ratios from the stylesheets, so a new token pair fails until it is checked.

### Search and the test release
- A search that names an entity exactly prefers the exact matches. Otherwise it matches by prefix.
  So "Mars" focuses Mars, and "alpha" offers every star with an alias that starts so.
- The `shared-names` test release is derived from 001-prototype by `ingest/test-release.ts`, without
  the network. It keeps only Earth's and Mercury's ephemerides, to stay at about 5 MB. The second
  "Mercury" is the element, transcribed from the PubChem periodic table that 001-prototype already
  holds. It cites that record, so nothing in it is illustrative. Its manifest points at
  001-prototype's raw snapshots and validation report, and the loader refuses it outside `?test`.

### The inspector
- The inspector opens from the metadata panel, where each value is a control, or with `i` on the
  selection. It shows an epoch outside the leap-second table, such as Hipparcos's J1991.25 in TT,
  as a Julian epoch. Converting that epoch to a UTC date had failed.

### The surface
- The transition band starts at 1 × 10¹² m/px, not 3 × 10¹¹. At that scale the Sun is under
  0.15 px from an Earth-centred view's centre, so it does not visibly move across the band. The
  geometric midpoint is therefore 5 × 10¹² m/px, and the reduced-motion cut happens there rather
  than at 3 × 10¹².
- A star's height above the ecliptic is drawn as a tick at the view's own scale, faint. Reading the
  ticks against the labels is a question for the sessions.
- The legend's "shown once on first use" is remembered in the browser's local storage. The test
  harness marks it as seen, and a scenario about the legend opens it.

### Tooling
- The fonts are vendored from Fontsource's woff2 files.
- The release loader skips files outside the release's curated directory. Those are the held-out
  fixtures under `tests/fixtures/`.
- The observation properties were refined while writing the curators. `raDec` and `properMotion`
  are four properties (`ra`, `dec`, `pmra`, `pmdec`), each with its own uncertainty.
