Feature: A reproducible release
  The atlas loads the curated data of a named release. The release is rebuilt from its manifest
  and raw snapshots without the network, and a release with an unfilled manifest is not called
  reproducible.

  Scenario: the curated data is rebuilt from the manifest and the raw snapshots without the network
    Given the manifest of the release "001-prototype" and its raw snapshots
    When the curated data is rebuilt without the network
    Then the curated data matches the checksums in the manifest

  Scenario: a release with an unfilled manifest is not called reproducible
    Given a manifest with a field that is unfilled
    When the release is built
    Then the release is not called reproducible
    And the unfilled field is named
