# Glossary

The words this project's features use, each in exactly one sense. A term is *Proposed* until
`/speckit-clarify` settles it or the features that use it pass against the application.

## The atlas and its people

### atlas
*Proposed.* The application: an explorable, connected representation of physical reality built
from a release of curated data.

### person
*Proposed.* Whoever is using the atlas. No account, no role.
Avoid: user, visitor

### release
*Proposed.* A frozen, named set of curated data the atlas loads, described by its manifest.

### manifest
*Proposed.* The document that names a release's sources, their queries, retrieval times, source
releases and checksums. A field of it is *unfilled* while it is null.

### curated data
*Proposed.* The validated files of a release the atlas loads, built from raw snapshots.

### raw snapshots
*Proposed.* The responses a source gave when the release was acquired, kept so the curated data
can be rebuilt.

### checksums
*Proposed.* The digests of the raw snapshots and the curated data, recorded in the manifest.

### reproducible
*Proposed.* Said of a release whose curated data is rebuilt from its manifest and raw snapshots,
without the network, to the checksums the manifest records.

### network
*Proposed.* Any external service; the atlas calls none while running.

## Things

### entity
*Proposed.* A real object, place, system or type the atlas knows by a stable atlas id, with its
names, classifications, relationships and evidence.
Avoid: object, node, item

### atlas id
*Proposed.* The stable identifier of an entity; it never changes once published.

### body
*Proposed.* An entity of the Solar System: the Sun, a planet, a moon, a curated small body.

### planet
*Proposed.* One of the eight planets of the Solar System.

### planets
*Proposed.* The plural of planet.

### star
*Proposed.* A star other than the Sun, as an entity; a nearby star is one in the star sample.

### nearby star
*Proposed.* A star in the star sample.

### nearby stars
*Proposed.* The plural of nearby star.

### stars
*Proposed.* The plural of star.

### substance
*Proposed.* A kind of matter as a type, such as water; not an individually tracked object.

### representative substance
*Proposed.* A substance shown for an entity because the entity contains it, with the assertion
status illustrative; it is not a part of the entity.

### molecule type
*Proposed.* A molecule as a type, such as the water molecule, with its atom types and counts.

### atom type
*Proposed.* An element as a type, such as hydrogen or oxygen.

### atom types
*Proposed.* The plural of atom type.

### atom
*Proposed.* One atom within a molecule type's structure, with a position in the molecular frame.

### counts
*Proposed.* How many of each atom type a molecule type has.

### kind
*Proposed.* The classification of an entity: planet, moon, star, substance, molecule type, atom type.

### canonical name
*Proposed.* The one name the atlas shows for an entity; other names are aliases.

### name
*Proposed.* A canonical name or an alias of an entity, as a person would type it.

## Knowledge

### observation
*Proposed.* A value of one property of one entity, with its unit, source record, epoch and
uncertainty where the source gives one.
Avoid: fact, data point

### derived state
*Proposed.* A value computed for a chosen time from observations and a named model, such as a
position evaluated from an ephemeris; it names what it came from.

### relationship
*Proposed.* A typed edge between two entities, such as satellite of, orbits, has part, composed
of, representative of; it has an assertion status and evidence.

### assertion status
*Proposed.* How a relationship or value is known: observed, derived, inferred or illustrative.

### illustrative
*Proposed.* The assertion status of what is shown for understanding and not asserted as observed,
derived or inferred.

### source record
*Proposed.* The record in a named dataset release an observation was taken from.

### dataset release
*Proposed.* The named release of a source dataset a source record belongs to.

### catalogue release
*Proposed.* The dataset release of a star catalogue.

### reference ephemeris
*Proposed.* The ephemeris a release's Solar System positions were taken from and are checked
against.

### held-out epoch
*Proposed.* An epoch of the reference ephemeris kept out of the release's data so that a derived
state can be checked against it.

### precision
*Proposed.* The stated tolerance within which a derived state agrees with the reference ephemeris;
*stated precision* is the one the atlas shows.

### uncertainty
*Proposed.* The stated uncertainty of an observation, as the source gives it.

### unit
*Proposed.* The unit of a value, shown with it.

### value
*Proposed.* The number an observation or a derived state gives, or missing.

### missing
*Proposed.* The state of a value the sources do not give; shown as such, never filled.

### radius
*Proposed.* The measured mean radius of a body.

### distance
*Proposed.* The distance between two entities, with its unit.

### position
*Proposed.* Where an entity is, in a reference frame at an epoch.

### epoch
*Proposed.* The instant a position or a state is valid for, in a named time scale.

### time scale
*Proposed.* The time system an epoch is expressed in.

### reference frame
*Proposed.* The coordinate system a position is expressed in, with its centre and orientation.

### molecular frame
*Proposed.* The reference frame of a molecule type's structure as its source record gives it;
never a celestial frame.

### cross-match record
*Proposed.* The record that says two source records in two catalogues are the same entity, with
the basis of the match; the only way a star enters the star sample from a second catalogue.

### basis of the match
*Proposed.* What a cross-match record rests on: a shared catalogue identifier, a position match
within a stated tolerance, or a published cross-identification.

### minimum scale
*Proposed.* The finest scale a body can be viewed at in the current release; scaling in stops there.

### star sample
*Proposed.* The bounded set of nearby stars a release holds, chosen by its selection criteria.

### selection criteria
*Proposed.* The bounds and quality cuts that chose the star sample, shown in the atlas.

## Navigation

### focus
*Proposed.* The entity the view is centred on and the breadcrumb ends at.

### selection
*Proposed.* The entity the person has picked; it has its own mark, distinct from any status mark.

### breadcrumb
*Proposed.* The real history of focuses, which going back walks.

### regime
*Proposed.* The rendering approach in force at the current scale.

### planetary
*Proposed.* The regime of the Solar System: bodies as discs, orbit tracks, moons in context.

### nearby stellar
*Proposed.* The regime of the star sample: the Sun as a stellar mark among the nearby stars.

### molecular
*Proposed.* The regime of structural navigation: molecule types and atom types in the molecular frame.

### spatial navigation
*Proposed.* Moving between entities by where they are relative to one another.

### structural navigation
*Proposed.* Moving between an entity and what it is part of or made of; never drawn as spatial
scaling.

### mode change
*Proposed.* The switch between spatial navigation and structural navigation, announced to the person.

### scales
*Proposed.* What the person does to travel across scale: scales out towards larger, scales in
towards smaller.

### pans
*Proposed.* What the person does to move the view across the projection plane.

### selects
*Proposed.* What the person does to make an entity the selection.

### focuses
*Proposed.* What the person does to make an entity the focus.

### goes back
*Proposed.* What the person does to return along the breadcrumb.

### searches
*Proposed.* What the person does to find an entity by name.

### inspects
*Proposed.* What the person does to open the inspector on a value, a position or a relationship.

### made of
*Proposed.* The explicit choice that enters structural navigation from an entity.

### scale rail
*Proposed.* The logarithmic physical scale shown beside the scene, with the regimes and where a
dimension is flattened.

### flattened
*Proposed.* Said of a dimension the projection has removed from view, declared on the scale rail.

### dimension
*Proposed.* One of the three spatial axes.

### time controller
*Proposed.* The control for the date, playing, pausing and the rate, showing the supported window.

### supported window
*Proposed.* The span of dates the release's ephemeris data covers; a date outside it is refused.

### date
*Proposed.* The civil date the person chooses; the atlas shows its epoch.

### rate
*Proposed.* How fast the date advances while playing.

### plays
*Proposed.* Starts the date advancing at the rate.

### pauses
*Proposed.* Stops the date advancing.

### paused
*Proposed.* The state in which the date does not advance.

### refused
*Proposed.* Said of a change the atlas does not make, saying why.

### inspector
*Proposed.* The affordance that shows a value's source record, dataset release, epoch, reference
frame, unit, uncertainty and assertion status without leaving the scene.

### metadata
*Proposed.* The small in-context text shown for the selection.

### legend
*Proposed.* The key to the marks, statuses, line styles and the selection criteria.

### context
*Proposed.* The surroundings an entity is shown in: a moon in its planet's, a planet in the
Solar System's, a star in the star sample's.

## Drawing

### mark
*Proposed.* What is drawn for an entity in the current regime: a disc, a point, a ring. A mark
is never the entity.
Avoid: sprite, glyph

### stellar mark
*Proposed.* The mark of a star, or of the Sun in the nearby stellar regime.

### status mark
*Proposed.* The mark that shows an assertion status; distinct from the selection mark.

### selection mark
*Proposed.* The mark that shows the selection; distinct from any status mark.

### orbit track
*Proposed.* The thin curve drawn for a body's orbit, from a stated model.

### orbit tracks
*Proposed.* The plural of orbit track.

### scale policy
*Proposed.* Whether marks are drawn at measured size ("true") or larger for legibility
("exaggerated"), with the factor labelled.

### exaggerated
*Proposed.* The scale policy, or the label of a mark, drawn larger than measured, with its factor.

### factor
*Proposed.* How many times larger than measured an exaggerated mark is drawn.

### point
*Proposed.* The smallest mark, for a body without a measured radius or a star.

### transition
*Proposed.* The change of drawing between regimes as the scale crosses a band.

### cut
*Proposed.* A transition with no animation.

### chapter cue
*Proposed.* The large typographic name of a regime shown briefly at a transition.

### reduced motion
*Proposed.* The device preference the atlas honours by making every transition a cut.

### colour
*Proposed.* Never the only carrier of a status.

### shape
*Proposed.* A carrier of status a person can read without colour.

### label
*Proposed.* Text drawn beside a mark.

### screen
*Proposed.* The visible scene; "the same place on the screen" means the same pixel position.

### pointer
*Proposed.* A mouse, trackpad or touch.

### keyboard
*Proposed.* The keys; every action by pointer is available by it.

### action
*Proposed.* One thing a person does: scales, pans, selects, focuses, goes back, changes the date,
inspects, searches.

## Everyday words

a, an, the, and, or, of, on, for, to, from, with, in, by, at, as, is, are, was, were, has, have,
had, does, do, did, not, no, nor, it, its, that, which, who, each, every, any, both, all, one,
two, three, eight, other, another, same, different, only, own, when, then, given, between,
before, after, first, last, now, until, while, yet, again, still, also, than, what, there, they,
them, their, never, nothing, else, among, about, outside, into, through, without, within, up,
down, out, past, so, but, if, be, been, this, these, those, how, more, same, true, right, well,
place, force, open, opens, opened, shows, shown, show, visible, read, reads, labelled, drawn,
draws, moves, moved, change, changes, changed, chooses, choose, chosen, ends, end, back, keeps,
kept, is, made, makes, says, say, said, announced, declares, declared, conveyed, resolves,
offered, offers, matches, match, named, names, name, called, built, rebuilt, unfilled, unchanged,
share, shared, distinct, apart, alone, as well, device, asks, outcome, field, entry, types, type,
displayed, measured, supported, reference, held, second, seconds, day, days, per, that, its,
positions, ten, over, under, during, around, towards, larger, smaller, enters, leaves, left,
returns, return, visible, movement, fade, fades, advance, advances, advancing, stops, remains,
dataset, data, record, records, source, sources, model, system, Solar System, sun, Sun, Earth,
Moon, moon, moons, Mars, Neptune, water, hydrogen, oxygen, Mercury, Proxima Centauri,
Alpha Centauri A, stays
