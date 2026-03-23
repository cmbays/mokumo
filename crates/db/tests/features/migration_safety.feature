Feature: Migration Safety

  Before upgrading the database schema, Mokumo creates a backup
  so shop data is never lost during an update.

  Scenario: Database is backed up before schema upgrade
    Given an existing database at schema version 1
    When a schema upgrade to version 2 runs
    Then a backup file "mokumo.db.backup-v1" is created
    And the backup contains the original data

  Scenario: Only the last three backups are kept
    Given the database is at schema version 4
    And backups exist from previous upgrades to versions 2, 3, and 4
    When a schema upgrade to version 5 runs
    Then a backup of version 4 is created before upgrading
    And the oldest backup is removed
    And three backup files remain

  Scenario: No backup on first run
    Given no database file exists
    When the database is initialized for the first time
    Then no backup file is created
