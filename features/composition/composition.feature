Feature: Descend into what Earth is made of
  Structural navigation is a different kind of step from moving through space, entered by an
  explicit choice and announced. Water is a representative substance, the water molecule shows its
  atom types, and molecular structure is drawn in the molecule's own reference frame.

  Background:
    Given the atlas is open on the release "001-prototype"
    And the focus is "Earth"

  Scenario: choosing what Earth is made of enters structural navigation and says so
    When the person chooses what the focus is made of
    Then structural navigation is in force
    And the mode change is announced

  Scenario: water is shown as a representative substance and not as a part of Earth
    Given structural navigation is in force from "Earth"
    When the person selects "water"
    Then "water" is labelled a representative substance of "Earth"
    And the relationship from "Earth" to "water" has the assertion status "illustrative"

  Scenario: the water molecule shows its atom types with their counts
    Given structural navigation is in force and the focus is "water"
    When the person focuses the molecule type of "water"
    Then the atom types "hydrogen" and "oxygen" are visible with the counts "2" and "1"
    And each atom type has a source record

  Scenario: an atom's position is in the molecule's own reference frame
    Given structural navigation is in force and the focus is the molecule type of "water"
    When the person inspects the position of an atom
    Then the reference frame is the molecular frame of the source record
    And no orbit track is visible

  Scenario: going back from the structural branch returns to Earth in spatial navigation
    Given structural navigation is in force and the focus is "water"
    When the person goes back
    Then the focus is "Earth"
    And spatial navigation is in force
    And the mode change is announced
