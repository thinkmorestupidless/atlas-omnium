Feature: Explore the Solar System from Earth
  The atlas opens on Earth. Scaling out brings the Moon, then the Sun, the planets and their
  orbit tracks into view. Every body is a selectable entity with a stable atlas id; a body drawn
  larger than life says so, and a true distance is always readable.

  Background:
    Given the atlas is open on the release "001-prototype"

  Scenario: the atlas opens with Earth as the focus
    When the person opens the atlas
    Then the focus is "Earth"
    And the scale rail and the time controller are visible

  Scenario: scaling out from Earth brings the Moon into view
    Given the focus is "Earth"
    When the person scales out
    Then "Moon" is visible as a mark in the context of "Earth"

  Scenario: scaling out past the Moon shows the Sun, the planets and their orbit tracks
    Given the focus is "Earth" and "Moon" is visible
    When the person scales out past "Moon"
    Then "Sun" and the eight planets are visible as marks
    And each planet has an orbit track

  Scenario: selecting a planet shows its name, its distance from the Sun and the source of both
    Given the planetary regime is in force
    When the person selects "Mars"
    Then the selection is "Mars"
    And the metadata shows the canonical name, the distance from "Sun" with its unit, and the source record of each

  Scenario: focusing a selected planet moves the view to it and extends the breadcrumb
    Given the selection is "Mars"
    When the person focuses the selection
    Then the focus is "Mars"
    And the breadcrumb ends with "Mars" after "Earth"

  Scenario: going back returns to the previous focus
    Given the breadcrumb is "Earth" then "Mars"
    When the person goes back
    Then the focus is "Earth"
    And the breadcrumb is "Earth"

  Scenario: an exaggerated size is labelled and the true distance stays readable
    Given the planetary regime is in force with the scale policy "exaggerated"
    When the person selects "Earth"
    Then the mark of "Earth" is labelled as exaggerated with its factor
    And the metadata shows the true distance from "Sun"

  Scenario: a true-scale view draws every body at its measured size
    Given the planetary regime is in force
    When the person chooses the scale policy "true"
    Then every visible mark is drawn at the measured radius of its entity
    And no mark is labelled as exaggerated

  Scenario: a body without a measured radius is drawn as a point and its radius is shown as missing
    Given a curated body with no observation of its radius
    When the person selects the body
    Then the mark of the body is a point
    And the metadata shows the radius as missing
