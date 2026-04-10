Feature: Restore candidate validation

  Before copying a user-provided .db file into the production slot,
  the validation pipeline checks identity, integrity, and schema
  compatibility. This runs against untrusted external files and is
  stricter than the startup guard chain (adds integrity_check).

  # --- Application ID check ---

  Scenario: File with application_id 0x4D4B4D4F passes identity check
    Given a SQLite file with application_id 0x4D4B4D4F
    When the file is validated as a restore candidate
    Then the identity check passes

  Scenario: File with application_id 0 passes identity check
    Given a SQLite file with application_id 0
    When the file is validated as a restore candidate
    Then the identity check passes

  Scenario: File with non-Mokumo application_id fails identity check
    Given a SQLite file with application_id 0xDEADBEEF
    When the file is validated as a restore candidate
    Then validation fails with NotMokumoDatabase

  Scenario: Non-SQLite file fails identity check
    Given a file that is not a valid SQLite database
    When the file is validated as a restore candidate
    Then validation fails with NotMokumoDatabase

  # --- Integrity check ---

  Scenario: Intact database passes integrity check
    Given a valid Mokumo database file
    When the file is validated as a restore candidate
    Then the integrity check passes

  Scenario: Truncated file fails integrity check
    Given a SQLite file with a valid header but truncated data pages
    When the file is validated as a restore candidate
    Then validation fails with DatabaseCorrupt

  Scenario: File with corrupted pages fails integrity check
    Given a SQLite file with deliberately corrupted page data
    When the file is validated as a restore candidate
    Then validation fails with DatabaseCorrupt

  # --- Schema compatibility check ---

  Scenario: Database with current schema version passes compatibility check
    Given a Mokumo database at the current schema version
    When the file is validated as a restore candidate
    Then the compatibility check passes

  Scenario: Database with older schema version passes compatibility check
    Given a Mokumo database at an older schema version
    When the file is validated as a restore candidate
    Then the compatibility check passes
    And the candidate info reports the older schema version

  Scenario: Database with unknown migration versions fails compatibility check
    Given a Mokumo database with migrations not known to this binary
    When the file is validated as a restore candidate
    Then validation fails with SchemaIncompatible

  Scenario: Fresh database with no migrations table passes compatibility check
    Given a Mokumo database with no seaql_migrations table
    When the file is validated as a restore candidate
    Then the compatibility check passes

  # --- Candidate info ---

  Scenario: Successful validation returns candidate info
    Given a valid Mokumo database file of 512KB
    When the file is validated as a restore candidate
    Then the candidate info contains the file size
    And the candidate info contains the schema version

  # --- Copy to production ---

  Scenario: Valid candidate is copied to production slot via backup API
    Given a valid Mokumo database file
    And no production database exists
    When the candidate is copied to the production slot
    Then the production database exists
    And the production database content matches the source

  Scenario: Copy is rejected when production database already exists
    Given a valid Mokumo database file
    And a production database already exists
    When a copy to the production slot is attempted
    Then the copy fails with ProductionDbExists

  Scenario: Copy uses atomic rename for placement
    Given a valid Mokumo database file
    And no production database exists
    When the candidate is copied to the production slot
    Then the copy uses a temporary file in the production directory
    And the temporary file is atomically renamed to the final path
