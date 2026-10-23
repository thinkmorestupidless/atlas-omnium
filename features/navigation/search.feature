Feature: Find a known thing by name
  A known name moves the focus to that entity in its context. A name shared by several entities
  offers each with its kind; 001-prototype has no shared name, so that is proved on a test release.

  Scenario Outline: searching a known name moves the focus to that entity in its context
    Given the atlas is open on the release "001-prototype"
    When the person searches "<name>"
    Then the focus is "<name>"
    And the <regime> regime is in force

    Examples:
      | name             | regime         |
      | Mars             | planetary      |
      | Proxima Centauri | nearby stellar |
      | water            | molecular      |

  Scenario: a name shared by several entities offers each with its kind
    Given the atlas is open on the test release "shared-names"
    And two entities share the name "Mercury"
    When the person searches "Mercury"
    Then each entity is offered with its kind
    And the focus is unchanged
