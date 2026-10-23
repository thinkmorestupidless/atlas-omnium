Feature: Move through time
  The planets and the Moon move to their positions at the chosen date. The epoch is always
  visible, the supported window is shown and never left, and a displayed position agrees with the
  reference ephemeris within the stated precision.

  Background:
    Given the atlas is open on the release "001-prototype"
    And the planetary regime is in force

  Scenario: the time controller shows the supported window
    When the person opens the time controller
    Then the supported window is shown with its first date and its last date

  Scenario: changing the date moves every supported body to its position at that date
    Given the date is "2026-10-22"
    When the person changes the date to "2030-01-01"
    Then every supported body is at its derived state for the epoch of "2030-01-01"

  Scenario: a date outside the supported window is refused and the view keeps its date
    Given the date is "2026-10-22" and the supported window ends at "2050-12-31"
    When the person changes the date to "2100-01-01"
    Then the change is refused with the supported window
    And the date is "2026-10-22"

  Scenario: playing advances the date at the chosen rate and pausing stops it
    Given the date is "2026-10-22" and the rate is "one day per second"
    When the person plays for "ten seconds" and pauses
    Then the date is "2026-11-01"
    And the date does not change while paused

  Scenario: the epoch of the displayed positions is always visible
    When the person changes the date to "2030-01-01"
    Then the epoch of the displayed positions is visible as "2030-01-01" in its time scale

  Scenario: a displayed position agrees with the reference ephemeris within the stated precision
    Given a held-out epoch of the reference ephemeris
    When the person changes the date to that epoch
    Then the derived state of every supported body is within the stated precision of the reference ephemeris
