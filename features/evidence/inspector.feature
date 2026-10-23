Feature: Inspect the evidence
  Every displayed value opens to its source record, release and epoch without leaving the scene,
  and to its source's attribution. A missing value is shown as missing. The assertion status of a relationship is shown apart from
  the selection, and every visible entity has an atlas id and a source record or is illustrative.

  Background:
    Given the atlas is open on the release "001-prototype"

  Scenario: a displayed value opens to its source record, release, epoch and attribution
    Given the selection is "Mars"
    When the person inspects the distance from "Sun"
    Then the inspector shows the source record, the dataset release and the epoch of the observation
    And the attribution of the source is shown beside the dataset release

  Scenario: a position shows its reference frame and its epoch
    Given the selection is "Mars"
    When the person inspects the position
    Then the inspector shows the reference frame and the epoch in its time scale

  Scenario: a value the sources do not give is shown as missing
    Given a curated body with no observation of its radius
    When the person inspects the radius of the body
    Then the inspector shows the radius as missing
    And no value is shown in its place

  Scenario: an uncertainty is shown with its value
    Given the selection is "Proxima Centauri"
    When the person inspects the distance from "Sun"
    Then the inspector shows the uncertainty with the value and its unit

  Scenario: the assertion status of a relationship is shown apart from the selection
    Given the selection is "Moon"
    When the person inspects the relationship "satellite of" to "Earth"
    Then the inspector shows the assertion status by a mark distinct from the selection mark
    And the assertion status is not conveyed by colour alone

  Scenario: every visible entity has an atlas id and a source record or an illustrative label
    When the person inspects every visible mark
    Then each mark resolves to an entity with an atlas id
    And each entity has a source record or is labelled illustrative

  Scenario: the atlas names the release it was built from
    When the person opens the inspector
    Then the inspector shows the release "001-prototype"

  Scenario: the release lists every source with its licence and attribution
    When the person opens the inspector on the release "001-prototype"
    Then every source of the release is listed with its licence and its attribution
