@future
Feature: Post-Migration Integrity Checking

  After applying a batch of migrations, kikan runs SQLite integrity
  and foreign key checks to catch silent corruption before the
  application boots. If checks fail, the pre-migration snapshot is
  restored automatically.

  # --- Foreign key validation ---

  Scenario: Migrations that orphan foreign key relations trigger a rollback
    Given a database with a valid pre-migration snapshot
    When a migration executes that orphans a foreign key relation
    And the post-migration foreign key check fails
    Then the engine reports an integrity-check-failed error
    And the database is restored to the pre-migration snapshot
    And the error identifies which table and row violated the constraint

  Scenario: Foreign keys are disabled during the migration batch
    Given a migration batch that includes a table rebuild
    When the migration runner executes the batch
    Then foreign keys are disabled before the first migration
    And foreign keys are re-enabled after the last migration
    And foreign key violations are caught by the post-batch check

  # --- Structural integrity ---

  Scenario: Structural corruption is caught before boot
    Given a migration batch completes
    When the post-migration integrity check fails
    Then the engine reports a database-corruption error
    And the database is restored to the pre-migration snapshot

  # --- Clean pass ---

  Scenario: Healthy database passes all post-migration checks
    Given a migration batch completes successfully
    When the post-migration checks run
    Then the foreign key check passes
    And the integrity check passes
    And the engine proceeds to build application state
