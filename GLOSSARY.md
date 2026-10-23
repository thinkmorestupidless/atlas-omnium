# Glossary

The words this project's features use, each in exactly one sense. A term is *Proposed* until
`/speckit-clarify` settles it or the features that use it pass against the application. Every
term below was settled by `/speckit-clarify` on 2026-10-23; a new term enters as *Proposed*.

## The atlas and its people

### atlas
The application: an explorable, connected representation of physical reality built
from a release of curated data.

### person
Whoever is using the atlas. No account, no role.
Avoid: user, visitor

### release
A frozen, named set of curated data the atlas loads, described by its manifest.

### test release
A small release built for a scenario the curated data cannot set up, such as
"shared-names"; never published and never loaded by a person.

### manifest
The document that names a release's sources, their queries, retrieval times, source
releases and checksums. A field of it is *unfilled* while it is null.

### curated data
The validated files of a release the atlas loads, built from raw snapshots.

### raw snapshots
The responses a source gave when the release was acquired, kept so the curated data
can be rebuilt.

### checksums
The digests of the raw snapshots and the curated data, recorded in the manifest.

### reproducible
Said of a release whose curated data is rebuilt from its manifest and raw snapshots,
without the network, to the checksums the manifest records.

### network
Any external service; the atlas calls none while running.

## Things

### entity
A real object, place, system or type the atlas knows by a stable atlas id, with its
names, classifications, relationships and evidence.
Avoid: object, node, item

### atlas id
The stable identifier of an entity; it never changes once published.

### body
An entity of the Solar System: the Sun, a planet, a moon, a small body.

### small body
The kind of a curated additional body of the Solar System: a dwarf planet, an asteroid
or a comet alike in 001.

### planet
One of the eight planets of the Solar System.

### planets
The plural of planet.

### star
A star as an entity, the Sun included; a nearby star is one in the star sample.

### nearby star
A star in the star sample.

### nearby stars
The plural of nearby star.

### stars
The plural of star.

### substance
A kind of matter as a type, such as water; not an individually tracked object.

### representative substance
A substance shown for an entity because the entity contains it, with the assertion
status illustrative; it is not a part of the entity.

### molecule type
A molecule as a type, such as the water molecule, with its atom types and counts.

### atom type
An element as a type, such as hydrogen or oxygen.

### atom types
The plural of atom type.

### atom
One atom within a molecule type's structure, with a position in the molecular frame.

### counts
How many of each atom type a molecule type has.

### kind
The classification of an entity: star, planet, moon, small body, substance, molecule
type, atom type. The Sun's kind is star.

### canonical name
The one name the atlas shows for an entity; other names are aliases.

### name
A canonical name or an alias of an entity, as a person would type it.

## Knowledge

### observation
A value of one property of one entity, with its unit, source record, epoch and
uncertainty where the source gives one.
Avoid: fact, data point

### derived state
A value computed from observations and a named model, such as a position evaluated
from an ephemeris for a chosen time or a distance from a parallax; it names what it came from.

### relationship
A typed edge between two entities, such as satellite of, orbits, has part, composed
of, representative of; it has an assertion status and evidence.

### assertion status
How a relationship or value is known: observed, derived, inferred or illustrative.

### illustrative
The assertion status of what is shown for understanding and not asserted as observed,
derived or inferred.

### source record
The record in a named dataset release an observation was taken from.

### dataset release
The named release of a source dataset a source record belongs to.

### catalogue release
The dataset release of a star catalogue.

### licence
The terms a source publishes its data under, recorded in the manifest.

### attribution
The credit a source asks for, recorded in the manifest and shown beside its dataset
release and in the release's list of sources.

### reference ephemeris
The ephemeris a release's Solar System positions were taken from and are checked
against.

### held-out epoch
An epoch of the reference ephemeris kept out of the release's data so that a derived
state can be checked against it.

### precision
The stated tolerance within which a derived state agrees with the reference ephemeris;
*stated precision* is the one the atlas shows.

### uncertainty
The stated uncertainty of an observation, as the source gives it, or of a derived
value, as its model carries it through.

### parallax
The observation a star's distance is derived from, with the catalogue's uncertainty.

### range
An uncertainty given as a lower and an upper bound rather than a single figure.

### unit
The unit of a value, shown with it.

### value
The number an observation or a derived state gives, or missing.

### missing
The state of a value the sources do not give; shown as such, never filled.

### radius
The measured mean radius of a body.

### distance
The distance between two entities, with its unit. A nearby star's distance is a derived
value from its parallax observation by the model "inverse parallax"; its uncertainty is a range.

### position
Where an entity is, in a reference frame at an epoch.

### epoch
The instant a position or a state is valid for, in a named time scale.

### time scale
The time system an epoch is expressed in.

### reference frame
The coordinate system a position is expressed in, with its centre and orientation.

### molecular frame
The reference frame of a molecule type's structure as its source record gives it;
never a celestial frame.

### cross-match record
The record that says two source records in two catalogues are the same entity, with
the basis of the match; the only way a star enters the star sample from a second catalogue.

### basis of the match
What a cross-match record rests on: a shared catalogue identifier, a position match
within a stated tolerance, or a published cross-identification.

### minimum scale
The finest scale a body can be viewed at in the current release; scaling in stops there.

### star sample
The bounded set of nearby stars a release holds, chosen by its selection criteria.

### selection criteria
The bounds and quality cuts that chose the star sample, shown in the atlas.

## Navigation

### focus
The entity the view is centred on and the breadcrumb ends at.

### selection
The entity the person has picked; it has its own mark, distinct from any status mark.

### breadcrumb
The real history of focuses, which going back walks.

### regime
The rendering approach in force at the current scale.

### planetary
The regime of the Solar System: bodies as discs, orbit tracks, moons in context.

### nearby stellar
The regime of the star sample: the Sun as a stellar mark among the nearby stars.

### molecular
The regime of structural navigation: molecule types and atom types in the molecular frame.

### spatial navigation
Moving between entities by where they are relative to one another.

### structural navigation
Moving between an entity and what it is part of or made of; never drawn as spatial
scaling.

### mode change
The switch between spatial navigation and structural navigation, announced to the person.

### scales
What the person does to travel across scale: scales out towards larger, scales in
towards smaller.

### pans
What the person does to move the view across the projection plane.

### selects
What the person does to make an entity the selection.

### focuses
What the person does to make an entity the focus.

### goes back
What the person does to return along the breadcrumb.

### searches
What the person does to find an entity by name.

### inspects
What the person does to open the inspector on a value, a position or a relationship.

### made of
The explicit choice that enters structural navigation from an entity.

### scale rail
The logarithmic physical scale shown beside the scene, with the regimes and where a
dimension is flattened.

### flattened
Said of a dimension the projection has removed from view, declared on the scale rail.

### dimension
One of the three spatial axes.

### time controller
The control for the date, playing, pausing and the rate, showing the supported window.

### supported window
The span of dates the release's ephemeris data covers; a date outside it is refused.

### date
The civil date the person chooses; the atlas shows its epoch.

### rate
How fast the date advances while playing.

### plays
Starts the date advancing at the rate.

### pauses
Stops the date advancing.

### paused
The state in which the date does not advance.

### refused
Said of a change the atlas does not make, saying why.

### inspector
The affordance that shows a value's source record, dataset release, epoch, reference
frame, unit, uncertainty and assertion status without leaving the scene.

### metadata
The small in-context text shown for the selection.

### legend
The key to the marks, statuses, line styles and the selection criteria.

### context
The surroundings an entity is shown in: a moon in its planet's, a planet in the
Solar System's, a star in the star sample's.

## Drawing

### mark
What is drawn for an entity in the current regime: a disc, a point, a ring. A mark
is never the entity.
Avoid: sprite, glyph

### stellar mark
The mark of a star in the nearby stellar regime, the Sun included.

### status mark
The mark that shows an assertion status; distinct from the selection mark.

### selection mark
The mark that shows the selection; distinct from any status mark.

### orbit track
The thin curve drawn for a body's orbit, from a stated model.

### orbit tracks
The plural of orbit track.

### scale policy
Whether marks are drawn at measured size ("true") or larger for legibility
("exaggerated"), with the factor labelled.

### exaggerated
The scale policy, or the label of a mark, drawn larger than measured, with its factor.

### factor
How many times larger than measured an exaggerated mark is drawn.

### point
The smallest mark, for a body without a measured radius or a star.

### transition
The change of drawing between regimes as the scale crosses a band.

### cut
A transition with no animation.

### chapter cue
The large typographic name of a regime shown briefly at a transition.

### reduced motion
The device preference the atlas honours by making every transition a cut.

### colour
Never the only carrier of a status.

### shape
A carrier of status a person can read without colour.

### label
Text drawn beside a mark.

### screen
The visible scene; "the same place on the screen" means the same pixel position.

### pointer
A mouse, trackpad or touch.

### keyboard
The keys; every action by pointer is available by it.

### action
One thing a person does: scales, pans, selects, focuses, goes back, changes the date,
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
Alpha Centauri A, stays, beside, listed
