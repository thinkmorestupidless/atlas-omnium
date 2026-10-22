Feature: Travel out to the nearby stars
  Scaling out past the planets fades the orbit tracks and leaves the Sun as a stellar mark among a
  bounded sample of nearby stars. The Sun keeps its identity and its selection. A star shows its
  distance with its uncertainty and its source record, and no planets the sources do not give.

  Background:
    Given the atlas is open on the release "001-prototype"

  Scenario: scaling out past the planets fades the orbit tracks and leaves the Sun as a stellar mark
    Given the planetary regime is in force
    When the person scales out past the orbit track of "Neptune"
    Then the orbit tracks fade
    And "Sun" is visible as a stellar mark at the same place on the screen

  Scenario: the Sun keeps its identity and its selection across the transition
    Given the planetary regime is in force and the selection is "Sun"
    When the person scales out until the nearby stellar regime is in force
    Then the selection is "Sun"
    And the breadcrumb is unchanged

  Scenario: the nearby stars appear with the Sun among them
    When the person scales out until the nearby stellar regime is in force
    Then the nearby stars of the star sample are visible as marks
    And "Sun" is one mark among them

  Scenario: selecting a nearby star shows its distance, its uncertainty and its source record
    Given the nearby stellar regime is in force
    When the person selects "Proxima Centauri"
    Then the metadata shows the distance from "Sun" with its unit, its uncertainty and its source record

  Scenario: a selected star shows no planets the sources do not give
    Given the nearby stellar regime is in force
    When the person focuses "Proxima Centauri"
    Then no mark is visible for an entity the release has no source record for

  Scenario: the selection criteria of the star sample are shown
    Given the nearby stellar regime is in force
    When the person opens the legend
    Then the selection criteria of the star sample are shown with the catalogue release

  Scenario: scaling back in reverses the transition exactly
    Given the nearby stellar regime is in force and the selection is "Sun"
    When the person scales in until the planetary regime is in force
    Then the orbit tracks are visible
    And the selection is "Sun"
    And "Sun" is at the same place on the screen

  Scenario: the flattened dimension is declared on the scale rail
    Given the nearby stellar regime is in force
    When the person reads the scale rail
    Then the scale rail declares that a dimension is flattened

  Scenario: a bright star the catalogue lacks is drawn through a cross-match record showing both source records
    Given the nearby stellar regime is in force
    When the person selects "Alpha Centauri A"
    Then the star is visible as a stellar mark
    And the inspector shows a cross-match record with both source records and the basis of the match
