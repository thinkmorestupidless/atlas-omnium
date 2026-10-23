Feature: Use it with a keyboard and without motion
  Every action available by pointer is available by keyboard. Reduced motion replaces every
  transition with a cut. No status is conveyed by colour alone.

  Background:
    Given the atlas is open on the release "001-prototype"

  Scenario: every action available by pointer is available by keyboard
    When the person scales, pans, selects, focuses, goes back, changes the date and inspects by keyboard
    Then each action has the same outcome as by pointer

  Scenario: reduced motion replaces every transition with a cut
    Given the device asks for reduced motion
    When the person scales out until the nearby stellar regime is in force
    Then the transition is a cut
    And the chapter cue is shown without movement

  Scenario: no status is conveyed by colour alone
    When the person inspects every status mark and every legend entry
    Then each status is conveyed by a shape or a label as well as a colour
