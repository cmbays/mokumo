@future
Feature: Downgrade Protection

  Mokumo refuses to boot if the database was created by a newer
  version of the software. This prevents silent data corruption
  from schema mismatches. The shop owner receives actionable recovery
  options instead of a crash.

  # --- Version gate ---

  Scenario: Equal version proceeds normally
    Given a database created by engine version 1 and app version 1
    And the current binary is engine version 1 and app version 1
    When the engine starts
    Then the version check passes
    And the boot continues normally

  Scenario: Newer binary with older data proceeds with migration
    Given a database created by engine version 1
    And the current binary is engine version 2
    When the engine starts
    Then the version check passes
    And pending migrations are applied

  Scenario: Older binary refuses newer database
    Given a database created by engine version 2
    And the current binary is engine version 1
    When the engine starts
    Then the engine refuses to boot
    And a downgrade error is returned with recovery actions

  Scenario: Fresh database has no version metadata
    Given no kikan_meta table exists
    When the engine starts for the first time
    Then the version metadata is populated after successful boot
    And no downgrade check is performed

  # --- Recovery actions ---

  Scenario: Downgrade error includes actionable recovery options
    Given a downgrade error has occurred
    Then the error includes the stored and binary version numbers
    And the recovery actions include restoring from a snapshot
    And the recovery actions include downloading the correct version
    And the recovery actions do not include contacting support
