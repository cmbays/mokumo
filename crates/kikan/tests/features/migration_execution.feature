Feature: Migration Execution

  Kikan runs each migration inside an immediate-mode SQLite transaction.
  Applied migrations are tracked in the kikan_migrations table so
  migrations are never run twice.

  # --- Bootstrap ---

  Scenario: Tracking tables are created before any migration runs
    Given a fresh database with no kikan tables
    When migrations are executed
    Then the kikan_migrations table exists before the first migration runs

  Scenario: Bootstrap is idempotent
    Given a database where kikan_migrations already exists
    When migrations are executed
    Then no error occurs
    And existing migration records are preserved

  # --- Transaction safety ---

  Scenario: Each migration runs in its own immediate transaction
    Given a graft with three migrations
    When migrations are executed
    Then each migration runs inside a BEGIN IMMEDIATE transaction
    And each transaction is committed independently

  Scenario: A failed migration does not affect previously applied migrations
    Given three migrations where the third contains invalid SQL
    When migrations are executed
    Then the first two migrations are committed
    And the third migration fails
    And the database schema reflects only the first two migrations

  # --- Tracking ---

  Scenario: Applied migrations are recorded with their graft identity
    Given a graft with two migrations
    When both migrations are applied
    Then kikan_migrations contains two rows
    And each row records the graft ID, migration name, and timestamp

  Scenario: Already-applied migrations are skipped
    Given a graft with three migrations
    And the first two have already been applied
    When migrations are executed
    Then only the third migration runs
    And kikan_migrations contains three rows

  # --- Foreign key handling ---

  Scenario: Foreign keys are managed by the runner, not individual migrations
    Given a migration that rebuilds a table using the 12-step ALTER TABLE pattern
    When the migration runs
    Then the runner has disabled foreign keys before the migration
    And the migration does not need to toggle PRAGMA foreign_keys itself
    And foreign keys are re-enabled after the batch completes
