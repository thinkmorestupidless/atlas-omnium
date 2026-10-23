# Atlas Omnium.

*Renamed from "an atlas of everything." on 2026-10-23 (decision 0008); the brief is otherwise as written.*

**Product vision, experience design, system specification and first implementation plan**  
Version 0.1 — 22 October 2026  
Status: Working product and engineering brief

> **Every place. Every scale. Everything we know.**

## 1. The idea

Atlas Omnium is an explorable, connected representation of physical reality as humanity currently understands it.

It isn't another animation of the scale of the universe. It isn't primarily an astronomy encyclopedia, a conventional 3D space simulator or a collection of disconnected models. It is a place to navigate **real entities, actual observed places, their structure, motion and relationships**, travelling outwards through astronomical scales and inwards through physical composition.

The fundamental interaction is simple: encounter a thing, explore where it is, what surrounds it, what it belongs to and what it is made of. Follow those relationships without losing the sense that everything belongs to the same reality.

The long-term ambition is to include every publicly documented physical object or place for which usable information exists. That is a direction, not a claim that the atlas already contains literally everything. Much of reality has not been observed, many observations are incomplete, and some phenomena cannot be assigned an individual, persistent identity or a precise position. **Those limits are part of the atlas.**

### The experience we want

Start at Earth. Zoom out through the Earth–Moon system and planetary orbits. Watch the Solar System move as time advances. Keep moving out until the Sun becomes one point among neighbouring stars. Select another star and travel towards it. Return to Earth and follow a different path, through water and molecules to atoms. At every step, know whether the view is measured, inferred, schematic or illustrative.

The forest analogy remains a useful design metaphor: a leaf, a tree, a forest canopy and an entire landscape are different views of an interconnected reality. The name is **an atlas of everything.** The earlier **Orders of Magnitude** concept becomes a core navigation capability, not the product name.

## 2. Product principles

1. **Reality first.** Real identities, relationships and evidence take precedence over visual spectacle. Do not invent planets, surfaces or precise measurements to fill gaps.
2. **The universe is the interface.** Selecting and navigating things should be the primary interaction; panels, menus and searches are secondary.
3. **Continuous context, changing representation.** A selected object retains its identity as we cross scales, even when the rendering switches from orbital geometry to point clouds or fields.
4. **Every object is a doorway.** Explore surroundings, containing systems, constituents, movement, history and evidence where available.
5. **Show the limits of knowledge.** Distinguish observations, calculations, inferences, estimates, reconstructions and purely illustrative graphics.
6. **Time matters.** A place or object's configuration may be time-dependent. Coordinates without their reference frame and epoch are insufficient.
7. **Different physics deserves different graphics.** There is no single truthful camera metaphor from galaxies to atoms.
8. **Beauty through restraint.** Geometric marks, typography, deliberate colour, elegant movement; no obligatory black starfield or photorealistic texture.
9. **Traceable claims.** Displayed scientific facts should resolve to a source record, release and transformation where practicable.
10. **Incremental coverage.** Start with a coherent, curated slice and add independently validated domains over time.

## 3. Audience and use cases

The initial audience is curious people who want to explore physical reality through interaction, including technically minded adults, educators, students and astronomy enthusiasts. The interaction should require no astronomy background. The system should remain useful to experts by exposing source details, units, assumptions and uncertainty.

Representative user stories:

- I can find Mars, select it and see its relationship to Earth and the Sun.
- I can change the date and observe planetary positions updating.
- I can move from Earth to the neighbouring stars without switching applications or opening a separate encyclopedia page.
- I can search for a known object and arrive in its spatial or structural context.
- I can ask what an object is made of and descend through an explicitly typed *composition* relationship.
- I can tell whether a visible object is directly observed, modelled, inferred or illustrative.
- I can inspect where a measurement came from and how old it is.

## 4. Navigation: four different questions

The product should not collapse every relationship into a camera zoom.

| Navigation mode | User question | Example | Important distinction |
|---|---|---|---|
| Spatial | Where is it relative to something else? | Earth to Mars | Requires positions, frames, distance and epoch |
| Scale | What becomes visible at another order of magnitude? | Solar System to stellar neighbourhood | May require a change of projection and mark type |
| Structural | What is it part of / made of? | Water to molecule to atoms | A *type* or representative specimen isn't an individually tracked object |
| Temporal | What changes over time? | Planetary motion | Different domains have different valid temporal models |

Other navigation dimensions can be added later: observation history, causal/physical interactions, taxonomy, discovery chronology and alternative scientific models.

### Identity across scale

The renderer may reduce a planetary system to a single symbolic mark at stellar scale. That mark still resolves to the same selected system; it does not become a new object merely because its geometry changed. Similarly, a smooth transition may visually interpolate between representations without pretending the interpolation is a physical phenomenon.

### Two distinct kinds of connection

- **Physical relations:** orbits, gravitation, containment, relative positions, compositional parts.
- **Knowledge relations:** observed by, derived from, same-as catalog entry, supported by, superseded by, estimated from.

Neither should be confused with a purely graphical line, such as a leader line to a label or an artistic constellation edge.

## 5. Visual and interaction design

### Reference identity

Use the visual grammar of [thinkmorestupidless.com](https://thinkmorestupidless.com/): oversized heavy sans-serif headlines; small monospaced metadata; warm cream canvas; decisive flat panels in vermilion, cobalt, yellow, violet and near-black; a strict editorial grid; semantic circles, rings, dots and dashed marks; bold vertical or spatial compositions. The aesthetic is contemporary, playful and unapologetically graphic, not retro-futurist.

Suggested opening lock-up:

> **Atlas Omnium.**  
> Every place. Every scale. Everything we know.

The full stop is part of the visual signature. Keep the visible interface almost entirely 2D even when the underlying data is spatially 3D.

### Visual vocabulary

| Element | Intended role |
|---|---|
| Solid discs | Physical entities or projected point objects |
| Thin circular/elliptical lines | Computed or observed orbital paths when scientifically appropriate |
| Small marks and ticks | Scale, time, angles, reference axes |
| Point clouds | Spatially distributed stars or galaxies |
| Density fields | Collective structure beyond individually legible marks |
| Contours | Field values such as gravitational potential, with clear model provenance |
| Leader lines | Labels or annotations, visually distinct from physical relationships |
| Semantic rings/halos | Selection, uncertainty or observation status, defined by a stable legend |
| Large typography | Scale transition, location identity, chapter-like moments |

We should *not* hard-code the circle-status mapping from the early concept sketch as a scientific truth. The symbols for observed/inferred/uncertain must be designed and validated against actual epistemic categories. Selection state must not be mistaken for an evidence classification. Colour may communicate scale regime at the scene level, but must not simultaneously encode a different scientific property without an explicit legend.

### Scale-sensitive rendering

| Regime | Rendering approach | Behaviour |
|---|---|---|
| Planetary | Discs, orbit tracks, moon systems, ticks | Time-sensitive, selectable bodies, true or exaggerated size options |
| Nearby stellar | Sparse point cloud, spectral or classification marks | Sun becomes a point; star distance and motion are inspectable |
| Galactic | Stellar density and large-scale structural features | Aggregate representation replaces individual-star legibility |
| Intergalactic | Galaxies as marks, groups, filaments, voids | Survey selection effects and observational coverage matter |
| Terrestrial | Geographic forms, administrative and physical boundaries | Surface navigation requires a separate geographic data regime |
| Molecular/atomic | Bonds, constituent particles and evidence-linked structural models | Quantum structure is not a miniature classical planetary system |

### Interaction

- Mouse wheel or trackpad: scale travel centred on pointer or selection, within an explicit spatial view.
- Drag: pan/orbit the chosen projection where meaningful.
- Click/tap: select a real entity or relation; show small in-context metadata.
- Double click / enter: focus on an entity.
- Breadcrumb/back: return along the actual navigation history.
- Time controller: play/pause, date and rate; show the valid range of the underlying model.
- Scale rail: logarithmic physical scale with semantic transitions and a clear indication of representational distortion.
- Search: resolve known entities, disambiguate results and travel to the selected entity's context.
- Evidence affordance: inspect source, release, epoch, units and uncertainty without leaving the scene.

Accessibility and input: keyboard navigation and reduced-motion mode from the beginning; legible labels, non-colour-only statuses, touch considerations and a fallback for devices without strong GPU support.

### Transition design

The transition from orbits to stellar points is the prototype's signature moment. As the solar system occupies fewer pixels, orbital paths diminish and then fade; the Sun remains spatially anchored as a single stellar mark; neighbouring stars become visible according to the scale and dataset. Large typographic chapter cues can appear briefly, then recede. This is a *visual representation transition*, not an assertion that orbits physically transform into stars.

## 6. A model of reality, not a giant scene graph

The underlying representation should be typed and provenance-aware. A possible initial schema:

```text
Entity
  id                  stable atlas identifier
  kind                Planet | Moon | Star | StarSystem | MoleculeType | AtomType | ...
  names               canonical name, aliases, catalogue identifiers
  classifications     typed domain classifications
  relations[]         typed entity relationships
  evidenceRefs[]      linked observations or source records

Relationship
  sourceId, predicate, targetId
  validityInterval?   when relation applies
  evidenceRefs[]
  assertionStatus     observed | derived | inferred | illustrative

Observation / ModelResult
  subjectId, property, value, unit
  sourceId, datasetRelease, recordIdentifier
  measuredAt / applicableEpoch
  referenceFrame?     required for physical position
  uncertainty?        representation and confidence/precision as available
  method / modelVersion?

RenderRepresentation
  subjectId, regime, projection, style
  geometrySource      measured | computed | approximate | illustrative
  scalePolicy         true | exaggerated | schematic
```

Separate **entity**, **observation**, **derived state** and **rendered mark**. Never conflate them. Different sources may identify the same entity differently: catalog cross-matches require explicit reconciliation rather than name-based guessing. Units and coordinate frames should be typed at boundaries, not silently converted in UI code.

### Coordinates and physics

- Solar System positions: time-dependent ephemerides in a documented frame and centre.
- Stellar neighbourhood: positions/distances/velocities derived from catalogue quantities with uncertainties and epoch assumptions.
- Galaxy and cosmic-web regimes: appropriate cosmological distances, coordinate conventions and redshift treatment; no pretence that all objects form a single Newtonian scene.
- Molecular structure: data-specific structural coordinates, not celestial coordinates.
- Spatial containment, physical composition and scientific classification are separate relationship types.

No giant universal N-body integration is planned. Each scientific regime uses the best suitable data/model; the atlas connects their identities and navigation.

### Knowledge quality

Keep separate fields for (a) existence, (b) identity, (c) position, (d) shape/size, (e) movement and (f) interpretation. Confidence in one does not imply confidence in all. A confirmed exoplanet can have a well-established orbital period and poorly known surface characteristics. Missing information should remain missing.

## 7. System architecture

The first implementation is deliberately small and local-first:

```text
Curated source snapshots
        │
        ▼
 Import / validation / provenance
        │
        ▼
 Typed atlas model + query interface
        │
        ├── spatial and temporal evaluation
        ├── relationship navigation
        └── knowledge/evidence inspection
        │
        ▼
 Navigation state (focus, scale, time, mode)
        │
        ▼
 Representation resolver
        │
        ├── orbit geometry renderer
        ├── point/density renderer
        └── composition renderer
        │
        ▼
 2D interactive GPU canvas + typographic HTML controls
```

A browser-based TypeScript application is the proposed first delivery. Use a GPU-backed 2D renderer where performance requires it; HTML/CSS handles typographic UI. Keep data processing isolated from rendering. No distributed backend, workflow engine, multi-agent architecture or database cluster is required for the first proof.

This can later map naturally onto EitherOr/Ankka-style twins, concepts and relationships, but that integration is not a first-prototype dependency. Choose persistent infrastructure only when corpus volume, collaborative curation or real-time updates justify it.

### Suggested repository structure

```text
atlas-omnium/
  README.md
  docs/
    vision.md
    data-contracts.md
    rendering.md
    evaluation.md
  app/
    src/
      model/
      navigation/
      projections/
      renderers/
      ui/
  data/
    manifests/
    curated/
  ingest/
    sources/
    validation/
  tests/
    fixtures/
    navigation/
    scientific/
    visual/
```

## 8. First implementation: 001 — earth

### Objective

Deliver one functioning, visually convincing interactive screen that can explore real Solar System objects, transition into a small true-data stellar neighbourhood, and demonstrate one separate inward composition path. It must prove both navigation coherence and data fidelity.

### In scope

1. An opening Earth-focused scene in the website-derived graphic style.
2. Sun, eight planets, Earth's Moon and a small curated selection of additional satellites/objects where useful.
3. At least one reproducible epoch-specific position snapshot plus date-driven evaluation for supported bodies.
4. True physical position/distance display, with explicit visual exaggeration when needed for legibility.
5. Zoom/pan/focus, object selection, breadcrumb navigation, interactive scale rail.
6. Time play/pause and adjustable rate within valid Solar System ephemeris windows.
7. Stellar neighbourhood using a deliberately bounded Gaia-derived sample with valid distances and uncertainty treatment.
8. A smooth Solar System ↔ stellar rendering transition that preserves the identity of the Sun/system.
9. Source panel/inspector exposing identifiers, values, units, epoch and provenance.
10. A prototype composition journey Earth → water (as a substance/type or representative sample) → H₂O molecule → constituent atom types, explicitly marked as structural rather than continuous spatial zoom.
11. Basic performance instrumentation and automated scientific/data validation.

### Out of scope for version 001

- Full Earth GIS, address-level mapping or accurate geographic journey to a particular tree.
- Real-time ingestion of all NASA/ESA data; arbitrary search across entire survey catalogues.
- Physically reconstructing the surfaces of exoplanets.
- Full galactic and cosmological datasets and cosmological dynamics.
- Complete microscopic biology or atom-level quantum simulation.
- Universal continuous 3D coordinates across all domains.
- User accounts, multiplayer, VR, procedural fictional worlds or AI-generated filler.
- Production-scale graph infrastructure or Ankka integration.

### Initial user journey

1. Open the application: Earth selected on a cream canvas; prominent title, a few quiet labels, scale rail and time control.
2. Zoom outward: Moon appears in the larger Earth context; zoom further to solar heliocentric view with orbit tracks.
3. Change time: selected planetary marks move to the evaluated positions, with epoch visible.
4. Select Mars: focus moves smoothly, metadata identifies source and coordinate convention.
5. Continue outward: orbital geometry recedes, Sun resolves to a stellar point, surrounding sample stars appear.
6. Select a nearby star: view moves to its location in the current projection, with no invented planetary system.
7. Return to Earth using history. Choose “what is it made of?” and enter the explicitly representative water/molecular branch.
8. Inspect the source and epistemic status of a displayed fact.

### Minimum data volumes

Start with approximately 10–30 astronomical bodies and a curated sample of dozens to hundreds of nearby stars, rather than a full Gaia import. Include a handful of structurally linked molecular entities. These are starting targets, subject to source availability and the needs of the visual transitions.

## 9. Delivery plan — initial two-week experiment

| Days | Deliverable | Evidence of completion |
|---|---|---|
| 1–3 | Interactive 2D canvas, typography, selections, scale rail, mock astronomy fixture | Smooth and understandable basic interaction |
| 4–6 | JPL/NASA data pipeline, model contracts, ephemeris evaluation, provenance | Correct positions at known epochs and traceable values |
| 7–9 | Nearby-star snapshot, regime resolver, orbit-to-stars transition | Selected Sun retains identity; no misleading coordinate mixing |
| 10–12 | Relationship traversal into water/molecule/atoms; evidence UI | Spatial and structural navigation clearly differentiated |
| 13–14 | Performance, accessibility, visual polish and usability sessions | Reproducible acceptance evidence and prioritised findings |

If the time estimate proves optimistic, protect the outward astronomical journey and data fidelity. Defer the inward branch rather than turning it into a misleading shortcut.

### Acceptance criteria

- Every displayed object has a stable atlas ID and source reference or an explicit illustrative classification.
- Earth → Solar System → nearby stars → return is navigable without leaving the primary experience.
- Planetary positions update consistently for a selected valid time and agree with frozen reference ephemerides within stated precision.
- The current selection survives each visual regime transition.
- Users can distinguish real distances from illustrative size exaggerations.
- At least one inward composition path is navigable and clearly identified as a different relation from spatial position.
- Epoch, frame, relevant units and uncertainty/missing-value information are inspectable.
- No factual scientific value silently defaults to a fabricated value when absent.
- The interface works with mouse/keyboard and provides reduced-motion support.
- The demo uses fixed source snapshots and can be reproduced from a manifest.

### What to measure

**Interaction/usability:** time and assistance needed to find Mars; navigate to another star; return to Earth; and find what water is made of. Track incorrect mental models, reversals, wrong selections and whether users understand the change in navigation mode.

**Scientific fidelity:** source-record coverage, position/epoch comparison error, unit conversion tests, invalid-frame rejection, uncertainty display correctness and number of unsupported claims.

**Performance:** frame time distributions on a stated test machine, visible mark count, render/update latency, transition responsiveness, scene load times, memory growth and input-to-response delay.

**Visual quality:** compare screenshots at standard scales, evaluate label collisions and disappearing marks, check colour/contrast and test whether the graphic vocabulary is understood without training.

**Decision gate:** proceed to larger coverage if independent users can navigate the core journeys, scientific contracts remain valid and transition quality is compelling. Otherwise iterate the interaction model before scaling the data pipeline.

## 10. Data sources and integration roadmap

These are candidate authoritative or primary sources, not a promise that every record can be freely redistributed or used without conditions. Check licences, acknowledgements, attribution, API rate limits and data-release notices for each integration.

| Scope | Source | Intended usage | Stage |
|---|---|---|---|
| Solar System time-dependent state | [NASA/JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Ephemerides, orbit and position evaluation | 001 |
| Solar System objects and physical properties | [NASA planetary fact sheets](https://nssdc.gsfc.nasa.gov/planetary/planetfact.html), [JPL physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) | Radii, mass and descriptive properties | 001 |
| Nearby stars | [ESA Gaia archive](https://gea.esac.esa.int/archive/), [DR3 documentation](https://gea.esac.esa.int/archive/documentation/GDR3/) | Catalogued positions, parallax and motion with uncertainties | 001 |
| Molecular compounds | [NIH PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | Molecular identity, formula and structures | 001 composition example |
| Experimental biological macromolecules | [RCSB Protein Data Bank APIs](https://www.rcsb.org/docs/programmatic-access/web-apis-overview) | Biological structure and evidence-backed coordinates | Later |
| Exoplanets | [NASA Exoplanet Archive API](https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html) | Confirmed planets, host systems, orbital measurements and uncertainties | Later |
| Galaxies | [NASA/IPAC Extragalactic Database](https://ned.ipac.caltech.edu/) | Extragalactic entities, measurements and cross-identifications | Later |
| Earth surface and places | [OpenStreetMap](https://www.openstreetmap.org/about) | Geographic features and mapped places; ODbL/attribution review required | Later |
| Other astronomy catalogues | SIMBAD, Minor Planet Center, SPICE kernels, SDSS/DESI surveys | Identity reconciliation, smaller bodies, geometric and cosmological coverage | Later; assess specific products |

For the prototype, do not call external scientific APIs once per rendered frame. Acquire a documented, reproducible dataset; validate it offline; freeze its inputs and transformations in a manifest; then render locally. Add versioned refreshes after the interaction model is proven.

### Example manifest fields

```yaml
atlas_release: 001-prototype
generated_at: 2026-10-22T00:00:00Z # example value; replace at build
sources:
  - name: jpl-horizons
    query_parameters: {}
    retrieval_time: null
    source_release: null
    checksum: null
  - name: gaia
    catalogue_release: DR3
    selection_query: null
    retrieval_time: null
    checksum: null
units_policy: SI-internal-with-explicit-conversions
validation_report: null
```

The null values are intentional placeholders for the build pipeline; they must be populated before claiming a reproducible scientific release.

## 11. Scientific and design risks

| Risk | Consequence | Mitigation |
|---|---|---|
| Tiny bodies versus enormous orbital distances | Real-scale planets become invisible | Separate true-scale distances and explicitly labelled size exaggeration |
| Mixed reference frames/epochs | Wrong apparent positions | Typed frame/epoch values; transformations tested against reference data |
| Gaia parallax and selection biases | Misleading apparent 3D star distribution | Curated quality-filtered sample; show selection criteria and uncertainty |
| Zoom interpreted as universal spatial operation | False continuity across molecular and cosmic domains | Explicit navigation modes and visual transitions |
| Cosmetic lines mistaken for physical interactions | False scientific relationships | Semantic legend and separate styling for annotation versus model edges |
| Over-simplified uncertainty | False confidence | Property-level uncertainty and missing values; model-specific representation |
| High data volume | Poor rendering and navigation | Level-of-detail resolution, clustering, streaming and spatial indexing as needed |
| Rapidly growing taxonomy | Brittle monolithic ontology | Typed core plus independently evolving domain extensions |
| Beautiful but confusing UI | Users cannot discover navigation | Task-based usability tests with non-specialists |

## 12. Later stages — deliberately provisional

**Stage 2: richer astronomical atlas.** Exoplanet systems, more of the stellar neighbourhood, curated clusters/nebulae, galaxy data, evidence and search. Build catalogue identity reconciliation and richer visual-level-of-detail strategies.

**Stage 3: terrestrial inward and outward continuity.** Earth geography, selected geological and biological structures, scientific models of matter and living systems. Establish how to communicate the boundary between a named individual object, a sampled specimen and a representative class.

**Stage 4: large-scale cosmology.** Galaxies, galaxy clusters, cosmic web, survey footprints and redshift-based inference. Design cosmological views from their own coordinate/physical assumptions.

**Stage 5: living atlas.** Incremental source refreshes, version history, discovery timelines, contributor workflows, quality review and potentially personal/shared exploratory journeys.

None of these stages should begin at full scale until the previous one has demonstrated a reliable data and visual model.

## 13. Decisions and open questions

### Decisions made

- Product name: **Atlas Omnium.** (was "an atlas of everything." until 2026-10-23)
- Core promise: **Every place. Every scale. Everything we know.**
- Scope includes inward physical structure as well as outward cosmic scale.
- Ground the atlas in actual observations, source provenance and explicit uncertainty.
- A 2D-first, avant-garde visual language inspired by thinkmorestupidless.com.
- Use scale-aware visual grammars and game-like direct manipulation.
- Start with the Earth/Solar System/nearby-stars vertical slice and one small structural exploration.
- Avoid production distributed infrastructure for the first experiment.

### Open questions worth testing rather than deciding prematurely

1. When should scrolling switch from continuous physical scale to an explicit structural jump?
2. What visual mark language for evidence and uncertainty is both accurate and immediately understandable?
3. Should scale regimes have dominant colours, or should colour remain reserved for physical attributes?
4. How should a user's point of view and focus be maintained through nonlinear, schematic projections?
5. Which nearby-star sampling/filtering strategy looks compelling without misleading users about catalogue completeness?
6. Should the opening scene be Earth, a single dot or a deliberately ambiguous mark revealed by interaction?
7. At what point do we replace the simple model/query interface with a persistent graph and richer data services?

## 14. Immediate next actions

1. Establish repository and implement typed identity, source and coordinate contracts.
2. Create a frozen reference dataset: Sun, planets, Moon and a small nearby-star sample.
3. Build the first cream/black/vermilion screen, drawing an Earth focus and an orbital track with precise circle geometry.
4. Wire selection, scroll-scale and time before adding more object types.
5. Implement the orbit-to-points transition and test it with someone new to the idea.
6. Record what fails: navigation comprehension, scientific claims, scale fidelity and motion/performance.

**Success for 001 is not how much of the universe we display. It's whether this small, real, connected part makes the larger vision believable.**
