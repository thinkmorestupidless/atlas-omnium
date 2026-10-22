# Feature Specification: 001 earth

**Feature Branch**: `001-earth`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Section 8 of `atlas-of-everything-product-spec.md`: one functioning, visually convincing interactive screen that explores real Solar System objects, transitions into a small true-data stellar neighbourhood, and demonstrates one separate inward composition path. It must prove both navigation coherence and data fidelity."

## User Scenarios & Testing *(mandatory)*

The stories are ordered as the brief orders its protections: if time runs short, the outward
astronomical journey and data fidelity (stories 1 to 4) are kept whole and the inward branch
(story 5) is deferred, never shortcut.

### User Story 1 - Explore the Solar System from Earth (Priority: P1)

A person opens the atlas and finds Earth as the focus on a cream canvas, with the product's name,
a few quiet labels, a scale rail and a time controller. Scaling out brings the Moon into Earth's
context, then the Sun, the eight planets and their orbit tracks. They select Mars and see its
name, its distance from the Sun and where both came from; focusing it moves the view there and
the breadcrumb grows; going back returns them. Bodies may be drawn larger than life so they can be
seen at all, and when they are, the view says so and the true distance stays readable.

**Why this priority**: It is the first screen and the frame every other story hangs on. Without it
nothing else can be reached.

**Independent Test**: Open the atlas, scale out to the heliocentric view, select and focus Mars,
read its distance and source, go back to Earth. Delivers a real, navigable Solar System on its own.

**Acceptance Scenarios** *(each names a scenario in a living feature; none is written here)*:

- added `features/solar-system/explore.feature`: the atlas opens with Earth as the focus
- added `features/solar-system/explore.feature`: scaling out from Earth brings the Moon into view
- added `features/solar-system/explore.feature`: scaling out past the Moon shows the Sun, the planets and their orbit tracks
- added `features/solar-system/explore.feature`: selecting a planet shows its name, its distance from the Sun and the source of both
- added `features/solar-system/explore.feature`: focusing a selected planet moves the view to it and extends the breadcrumb
- added `features/solar-system/explore.feature`: going back returns to the previous focus
- added `features/solar-system/explore.feature`: an exaggerated size is labelled and the true distance stays readable
- added `features/solar-system/explore.feature`: a true-scale view draws every body at its measured size
- added `features/solar-system/explore.feature`: a body without a measured radius is drawn as a point and its radius is shown as missing

---

### User Story 2 - Move through time (Priority: P2)

A person changes the date, or presses play, and the planets and the Moon move to where they were
or will be at that moment. The epoch of what is shown is always visible. The controller shows the
window the atlas supports and refuses a date outside it rather than guessing. What is shown agrees
with the reference ephemeris the atlas was built from, within a precision the atlas states.

**Why this priority**: Time is the brief's sixth principle and the first thing that makes the
Solar System real rather than a diagram. It is also the first data-fidelity claim the atlas makes.

**Independent Test**: Set a date, read a planet's position, compare with the frozen reference for
that date; set a date outside the window and see it refused; play and pause.

**Acceptance Scenarios** *(each names a scenario in a living feature; none is written here)*:

- added `features/time/time.feature`: the time controller shows the supported window
- added `features/time/time.feature`: changing the date moves every supported body to its position at that date
- added `features/time/time.feature`: a date outside the supported window is refused and the view keeps its date
- added `features/time/time.feature`: playing advances the date at the chosen rate and pausing stops it
- added `features/time/time.feature`: the epoch of the displayed positions is always visible
- added `features/time/time.feature`: a displayed position agrees with the reference ephemeris within the stated precision

---

### User Story 3 - Travel out to the nearby stars (Priority: P3)

A person keeps scaling out. The orbit tracks thin and fade, the planets go before them, and the
Sun becomes a single stellar mark without moving. The nearby stars appear around it, from a
bounded sample whose selection criteria are shown. The Sun is still the Sun: if it was selected it
is still selected. Selecting a nearby star shows its distance with its uncertainty and its source
record, and shows no planets the sources do not give. Scaling back in reverses the transition
exactly. The scale rail says that a third dimension has been flattened into the view.

**Why this priority**: The orbit-to-stars transition is the brief's signature moment and the proof
that identity survives a change of representation.

**Independent Test**: Select the Sun at planetary scale, scale out until stars appear, confirm the
Sun is still selected and still at the same place on the screen, select a star, read its distance
and uncertainty, scale back in.

**Acceptance Scenarios** *(each names a scenario in a living feature; none is written here)*:

- added `features/stars/neighbourhood.feature`: scaling out past the planets fades the orbit tracks and leaves the Sun as a stellar mark
- added `features/stars/neighbourhood.feature`: the Sun keeps its identity and its selection across the transition
- added `features/stars/neighbourhood.feature`: the nearby stars appear with the Sun among them
- added `features/stars/neighbourhood.feature`: selecting a nearby star shows its distance, its uncertainty and its source record
- added `features/stars/neighbourhood.feature`: a selected star shows no planets the sources do not give
- added `features/stars/neighbourhood.feature`: the selection criteria of the star sample are shown
- added `features/stars/neighbourhood.feature`: scaling back in reverses the transition exactly
- added `features/stars/neighbourhood.feature`: the flattened dimension is declared on the scale rail

---

### User Story 4 - Inspect the evidence (Priority: P4)

A person asks where a displayed fact came from and gets the answer without leaving the scene: the
source record, its release, the epoch, the reference frame of a position, the units, and the
uncertainty where the source gives one. A value the sources do not give is shown as missing, never
filled. The status of a relationship (observed, derived, inferred, illustrative) is shown apart
from whether the thing is selected. The atlas names the release it was built from, and every
visible entity has a stable identity and a source record or is labelled illustrative.

**Why this priority**: Traceable claims are the brief's ninth principle and what separates the atlas
from an animation. Every other story's values are only trustworthy because this one exists.

**Independent Test**: Open the inspector on Mars's distance, follow it to the record, release and
epoch; find a body with a missing property and see it shown as missing; read the release name.

**Acceptance Scenarios** *(each names a scenario in a living feature; none is written here)*:

- added `features/evidence/inspector.feature`: a displayed value opens to its source record, release and epoch
- added `features/evidence/inspector.feature`: a position shows its reference frame and its epoch
- added `features/evidence/inspector.feature`: a value the sources do not give is shown as missing
- added `features/evidence/inspector.feature`: an uncertainty is shown with its value
- added `features/evidence/inspector.feature`: the assertion status of a relationship is shown apart from the selection
- added `features/evidence/inspector.feature`: every visible entity has an atlas id and a source record or an illustrative label
- added `features/evidence/inspector.feature`: the atlas names the release it was built from
- added `features/release/release.feature`: the curated data is rebuilt from the manifest and the raw snapshots without the network
- added `features/release/release.feature`: a release with an unfilled manifest is not called reproducible

---

### User Story 5 - Descend into what Earth is made of (Priority: P5)

From Earth a person chooses "what is it made of?" and the atlas enters structural navigation,
saying plainly that this is a different kind of step from moving through space. Water is shown as
a representative substance Earth contains, not an individually tracked part of it. The water
molecule shows its two hydrogen atoms and one oxygen atom, drawn in the molecule's own frame and
not as a tiny solar system. Going back leaves the branch and returns to Earth in spatial
navigation.

**Why this priority**: It proves the atlas has more than one kind of relationship and that the
interface can say so. It is deferred before any outward story is shortened.

**Independent Test**: From Earth, enter the composition branch, reach the hydrogen atom type, read
its source, go back to Earth; confirm the mode change was announced on the way in and out.

**Acceptance Scenarios** *(each names a scenario in a living feature; none is written here)*:

- added `features/composition/composition.feature`: choosing what Earth is made of enters structural navigation and says so
- added `features/composition/composition.feature`: water is shown as a representative substance and not as a part of Earth
- added `features/composition/composition.feature`: the water molecule shows its atom types with their counts
- added `features/composition/composition.feature`: an atom's position is in the molecule's own reference frame
- added `features/composition/composition.feature`: going back from the structural branch returns to Earth in spatial navigation

---

### User Story 6 - Use it with a keyboard and without motion (Priority: P6)

A person who does not use a pointer completes every journey from the keyboard. A person who has
asked their device for reduced motion sees every transition as a cut, and the chapter cues
without movement. Nothing is told by colour alone.

**Why this priority**: The brief asks for keyboard navigation and reduced motion from the
beginning, and the acceptance criteria require both. It is a property of every control, not a
later tier.

**Independent Test**: Complete the journeys of stories 1 to 5 with the keyboard only; repeat with
reduced motion on and confirm no animated transition plays.

**Acceptance Scenarios** *(each names a scenario in a living feature; none is written here)*:

- added `features/navigation/access.feature`: every action available by pointer is available by keyboard
- added `features/navigation/access.feature`: reduced motion replaces every transition with a cut
- added `features/navigation/access.feature`: no status is conveyed by colour alone

---

### User Story 7 - Find a known thing by name (Priority: P7)

A person types a name they know (Mars, Proxima Centauri, water) and arrives in its context: a
planet in the heliocentric view, a star in the neighbourhood, a substance in the structural
branch. Ambiguous names are disambiguated by the entity's kind and catalogue identifiers.

**Why this priority**: The brief's representative stories include search, but the 001 journey does
not depend on it; it is the last story and the first to be deferred after story 5.

**Independent Test**: Search for a planet, a star and a substance, arrive at each.

**Acceptance Scenarios** *(each names a scenario in a living feature; none is written here)*:

- added `features/navigation/search.feature`: searching a known name moves the focus to that entity in its context
- added `features/navigation/search.feature`: a name shared by several entities offers each with its kind

---

### Edge Cases

- A body in the release has no measured radius: drawn as a point, its radius shown as missing
  (scenario in `features/solar-system/explore.feature`).
- A date outside the supported window: refused, the view keeps its date (scenario in
  `features/time/time.feature`).
- A nearby star whose parallax uncertainty is large: its distance uncertainty is shown as a
  range, and the star is still in the sample only if it passed the selection criteria that are
  shown (scenario in `features/stars/neighbourhood.feature`).
- The very brightest nearby stars are expected to be absent from the chosen catalogue. The atlas
  shows the gap and the selection criteria that explain it, or draws them from a second catalogue
  through an explicit cross-match: [NEEDS CLARIFICATION: Q1, see below].
- Scaling in past Earth's surface: the atlas has no terrestrial regime in 001; what the person sees
  and is offered is [NEEDS CLARIFICATION: Q3, see below].
- A relationship with no evidence: shown with status illustrative, never as observed.
- The release's manifest has a null field: the build refuses to call the release reproducible
  (scenario in `features/release/release.feature`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The atlas MUST open with a focus the person can read and act on, on a cream canvas,
  with the product's name, the scale rail and the time controller visible. The opening focus is
  [NEEDS CLARIFICATION: Q2, see below].
- **FR-002**: The atlas MUST present the Sun, the eight planets, Earth's Moon and the release's
  curated additional bodies as selectable entities with stable atlas ids.
- **FR-003**: The person MUST be able to scale the view continuously within a spatial regime,
  pan it, select an entity, focus an entity, and go back along the real history.
- **FR-004**: Every displayed position MUST be evaluated for the current date from the release's
  ephemeris data and MUST carry its reference frame and epoch.
- **FR-005**: The atlas MUST state the time window it supports, show the epoch of displayed
  positions at all times, and refuse a date outside the window without changing the view.
- **FR-006**: Displayed positions MUST agree with the frozen reference ephemeris at held-out epochs
  within a precision the atlas states and the inspector shows.
- **FR-007**: Where a body is drawn larger than its true size, the atlas MUST say so, MUST name the
  factor on request, and MUST keep true distances readable; distance MUST never be exaggerated.
- **FR-008**: The atlas MUST present a bounded sample of nearby stars with distance, distance
  uncertainty and source record for each, and MUST show the selection criteria of the sample.
- **FR-009**: The transition between the planetary and the nearby stellar regimes MUST preserve
  the focus and the selection as the same atlas ids, MUST keep the Sun at the same place on the
  screen, and MUST reverse exactly when scaled back.
- **FR-010**: The scale rail MUST show the physical scale on a logarithmic axis, the regime bands,
  and where the projection flattens a third dimension.
- **FR-011**: Every displayed scientific value MUST be inspectable without leaving the scene:
  source record, dataset release, epoch, reference frame where it applies, units, and uncertainty
  where the source gives one.
- **FR-012**: A value the sources do not give MUST be absent in the atlas and shown as missing;
  no numeric default may stand in for a measurement.
- **FR-013**: The assertion status of every relationship (observed, derived, inferred,
  illustrative) MUST be shown by a mark distinct from selection and focus, and never by colour
  alone.
- **FR-014**: Physical relations, knowledge relations and graphical annotations MUST be drawn in
  three distinct styles, with a legend the person can open.
- **FR-015**: Structural navigation MUST be a distinct mode from spatial navigation, entered by an
  explicit choice, announced on entry and on exit, and never drawn as a continuation of spatial
  scaling.
- **FR-016**: The composition branch MUST link Earth to water as a representative substance
  (status illustrative), water to the water molecule type and the molecule type to its atom types
  with counts, each with its source record, and MUST draw molecular structure in the molecule's
  own frame.
- **FR-017**: Every action available by pointer MUST be available by keyboard, and the atlas MUST
  honour the device's reduced-motion preference by replacing animated transitions with cuts.
- **FR-018**: The atlas MUST load only the curated data of a named release and MUST name that
  release; it MUST make no call to an external scientific service while running.
- **FR-019**: A release MUST be reproducible from its manifest and raw snapshots, and the build
  MUST refuse to call a release reproducible while any manifest field is unfilled.
- **FR-020**: The person MUST be able to search the release's named entities and arrive at the
  chosen entity in its context, with same-named entities distinguished by kind.
- **FR-021**: Each source's licence and attribution requirements MUST be recorded in the manifest
  and shown where the source requires.

### Key Entities *(each a term in the project glossary)*

- **entity**: a real object, place, system or type with a stable atlas id, names, classifications,
  relationships and evidence. In 001: the Sun, planets, the Moon, curated bodies, nearby stars,
  the substance water, the water molecule type, the atom types hydrogen and oxygen.
- **relationship**: a typed edge between two entities (orbits, satellite of, member of, has part,
  composed of, representative of; observed by, derived from, same as) with an assertion status and
  evidence.
- **observation**: one property's value for one entity with unit, source record, epoch and
  uncertainty where given.
- **derived state**: a value computed for a chosen time from observations and a named model, such
  as a position at a date; names what it came from.
- **mark**: what is drawn for an entity in the current regime; never the entity itself.
- **source record**: the record in a named dataset release an observation came from.
- **epoch** and **reference frame**: the instant and the coordinate system a position is valid in.
- **assertion status**: observed, derived, inferred or illustrative.
- **regime**: the rendering approach in force at the current scale; in 001, planetary, nearby
  stellar and molecular.
- **focus**, **selection**, **breadcrumb**: the entity the view centres on, the entity the person
  has picked, and the real history of focuses.
- **release** and **manifest**: the frozen set of curated data the atlas loads, and the document
  that names its sources, queries, retrieval times and checksums.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability sessions, at least four of five people new to the atlas find Mars,
  reach a nearby star, return to Earth and find what water is made of without assistance, each
  journey in under two minutes.
- **SC-002**: Every displayed position agrees with the frozen reference ephemeris at every held-out
  epoch within the stated precision; zero exceptions in the automated check.
- **SC-003**: Every displayed value has a source record, or the entity is labelled illustrative;
  source-record coverage is 100% of displayed values.
- **SC-004**: The selection and focus are unchanged across every regime transition in every
  automated navigation check and in every session.
- **SC-005**: In sessions, people correctly say whether a drawn size is true or exaggerated, and
  notice the change of navigation mode at the structural edge, at least four times in five.
- **SC-006**: Zero fabricated values: no numeric default stands in for a missing measurement in
  the release, as proved by an automated check over the curated data.
- **SC-007**: All seven journeys complete with keyboard only, and with reduced motion on no
  animated transition plays.
- **SC-008**: The scene responds to an input within a tenth of a second and the regime transition
  plays without visible stutter on the stated test machine.
- **SC-009**: The release is rebuilt from its manifest on a clean machine without the network and
  the result matches the committed curated data exactly.
- **SC-010**: Zero unsupported scientific claims found in a review of every label, cue and
  inspector text against the sources.

## Assumptions

- The supported time window is at least the five decades around today (2000 to 2050 is the
  working assumption); the plan confirms it with the ephemeris query.
- Sizes are exaggerated by default for legibility, labelled, with a true-scale option; distances
  are never exaggerated.
- The nearby-star sample is bounded by a distance threshold and quality criteria shown in the
  atlas; the working assumption is the stars within roughly 10 parsecs that pass the catalogue's
  quality cuts, pending Q1.
- The stellar neighbourhood is drawn in the same plane as the Solar System (seen from above the
  ecliptic) with the out-of-plane height shown as a mark, so the Sun never moves on screen across
  the transition.
- Colour may name a regime at scene level only with a legend and never a scientific property at
  the same time; whether regimes take dominant colours is tested in the sessions, not decided here.
- The visual marks for observed, derived, inferred and illustrative are designed in the plan and
  validated in the sessions; the spec requires only that they exist, differ from selection and are
  not colour alone.
- The additional curated bodies beyond the Sun, planets and Moon are a small hand-picked set
  (the brief says "where useful"); the plan names them.
- Earth has no terrestrial regime in 001; scaling in past its surface is bounded (Q3).
- No accounts, no persistence of a person's journey, no external calls while running.
- Visual quality is judged against screenshots at standard scales and in sessions; it is not a
  functional requirement here beyond the legend, labels and the lock-up.

## Clarifications

Three questions the brief leaves open and whose answers change the scope or the first screen.
Each is put to the owner as options with implications before planning; the rest of the brief's
open questions are planning matters and are carried in `docs/`.

### Q1: The nearby-star sample and the brightest stars

**Context**: FR-008 and the edge case on the brightest stars. The chosen catalogue is expected to
lack reliable astrometry for Sirius and the Alpha Centauri pair while holding Proxima and
hundreds of fainter neighbours.

**What we need to know**: Does the 001 neighbourhood show that gap honestly, or draw the missing
bright stars from a second catalogue through explicit cross-match records?

| Option | Answer | Implications |
|--------|--------|--------------|
| A | Show the gap: the sample is one catalogue's, the selection criteria explain the absences, and the inspector says so | Smallest scope and one source of truth; the view surprises anyone who knows the sky, which is itself a lesson about selection effects |
| B | Add the handful of missing bright stars from a second catalogue, each through an explicit cross-match row carrying both source records | The neighbourhood looks right to enthusiasts; adds a second source, a reconciliation table and the first identity-reconciliation work, which the brief placed in stage 2 |
| C | Show the gap in 001 and mark the bright stars' positions as "known, not in this sample" from a second catalogue without full records | A middle path; adds a second source anyway and a new status mark to design and explain |

### Q2: The opening scene

**Context**: FR-001. The brief's open question 6: Earth, a single dot, or a deliberately
ambiguous mark revealed by interaction.

**What we need to know**: What is on screen when the atlas opens?

| Option | Answer | Implications |
|--------|--------|--------------|
| A | Earth selected and focused, at a scale where the Moon is just out of view, with the lock-up, scale rail and time controller | Matches the brief's journey step 1 and the acceptance criteria; the person starts with a known thing |
| B | A single dot on the cream canvas with the lock-up; the first scroll reveals it is Earth | A stronger graphic opening; the first interaction teaches scale travel; a person who does not interact sees nothing named |
| C | Earth focused, but the lock-up fills the screen and recedes on the first interaction | A chapter-like opening; adds an animated state and a reduced-motion variant to design |

### Q3: Scaling in past Earth

**Context**: FR-015 and the edge case. 001 has no terrestrial regime. The brief's open question 1:
when should scrolling switch from continuous physical scale to an explicit structural jump?

**What we need to know**: What happens when a person scales in past Earth's surface?

| Option | Answer | Implications |
|--------|--------|--------------|
| A | Scaling stops at a stated minimum; the structural branch is entered only by the explicit "what is it made of?" choice | Cleanest separation of the four modes; the person must find the affordance, which the sessions measure |
| B | Scaling stops at the minimum and the atlas offers the structural step there ("Earth has no surface view yet; what is it made of?") | Discoverable; still an explicit choice, so the modes stay distinct; one more piece of copy and one more state |
| C | Scaling in past the minimum enters the structural branch with a chapter cue | Most fluid; risks the false continuity the brief warns against, and the sessions would have to prove the cue is enough |
