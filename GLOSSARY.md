# Glossary

The words this project's features use, each in exactly one sense. A term is *Proposed* until
`/speckit-clarify` settles it or the features that use it pass against the application. The first
feature's `/speckit-bdd-features` run proposes the first terms; the ones below are the brief's own
vocabulary, written down so the features start from one sense of each.

## Things

### entity
*Proposed.* A real object, place, system or type the atlas knows by a stable atlas id, with its
names, classifications, relationships and evidence. A planet, a star, a star system, a molecule
type, an atom type.
Avoid: object, node, item

### observation
*Proposed.* A value of one property of one entity, with its unit, source record, release, epoch
and uncertainty where the source gives one.
Avoid: fact, data point

### derived state
*Proposed.* A value computed for a chosen time from observations and a named model, such as a
position evaluated from an ephemeris; it names what it came from.

### mark
*Proposed.* What the renderer draws for an entity in the current regime: a disc, a point, a ring.
A mark is never the entity.

## Navigation

### focus
*Proposed.* The entity the view is centred on and the breadcrumb ends at.

### regime
*Proposed.* The rendering approach in force at the current scale: planetary, nearby stellar,
galactic, intergalactic, terrestrial, molecular.

### spatial navigation
*Proposed.* Moving between entities by where they are relative to one another.

### structural navigation
*Proposed.* Moving between an entity and what it is part of or made of; never drawn as spatial zoom.

### epoch
*Proposed.* The instant a position or a state is valid for, in a named time scale.

### reference frame
*Proposed.* The coordinate system a position is expressed in, with its centre and orientation.

## Knowledge

### assertion status
*Proposed.* How a relationship or value is known: observed, derived, inferred or illustrative.

### source record
*Proposed.* The record in a named dataset release an observation was taken from.

## Everyday words

selects, shows, moves, returns, opens, inspects, changes, appears, remains, visible, labelled,
missing, absent, same, another, date, time, scale
