@future
Feature: Upgrade Compatibility

  Existing Mokumo installations using the legacy migration system
  upgrade seamlessly to the kikan engine. Legacy migration records
  are backfilled automatically on first boot.

  # --- Automatic backfill ---

  Scenario: Existing installation is backfilled on first engine boot
    Given a database with 8 migrations recorded in seaql_migrations
    And no kikan_migrations table exists
    When the engine boots for the first time
    Then all 8 migration records appear in kikan_migrations
    And the seaql_migrations table is preserved for audit

  Scenario: Partially migrated installation is backfilled correctly
    Given a database with 3 of 8 migrations in seaql_migrations
    When the engine boots
    Then 3 records are backfilled into kikan_migrations
    And the remaining 5 migrations are applied normally

  Scenario: Backfill is idempotent
    Given a database that has already been backfilled
    When the engine boots again
    Then no duplicate records are created in kikan_migrations
    And no error occurs

  Scenario: Fresh installation requires no backfill
    Given no database file exists
    When the engine boots for the first time
    Then all migrations are applied fresh
    And no backfill operation runs

  # --- Schema equivalence ---

  Scenario: Engine produces identical schema to legacy migrator
    Given a fresh database migrated by the legacy SeaORM Migrator
    And a fresh database migrated by the kikan engine
    When the sqlite_master tables are compared
    Then the schemas are byte-for-byte identical
