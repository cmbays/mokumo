@future
Feature: Upgrade Safety

  Mokumo snapshots all databases before running migrations. If an
  upgrade fails, the snapshot is automatically restored so the shop
  owner's data is never lost. This is the P1 atomicity guarantee.

  # --- Pre-migration snapshot ---

  Scenario: All databases are snapshot before upgrade
    Given a shop with demo and production databases
    When the engine runs an upgrade
    Then a snapshot group is created containing both databases
    And each snapshot is a valid copy of the source database

  Scenario: Snapshot uses read-only access to source databases
    Given a database in use by the application
    When a snapshot is taken
    Then the source database is opened read-only
    And concurrent readers are not blocked

  # --- Automatic restore on failure ---
  #
  # The restore boundary covers the entire boot sequence from migration
  # through application state construction. This prevents a "limbo" state
  # where migrations succeed but the app fails to boot — leaving the
  # database at a schema the old binary can't use either.

  Scenario: Failed migration restores from snapshot
    Given a snapshot was taken before the upgrade
    When a migration fails during execution
    Then the databases are restored from the snapshot
    And the engine reports a boot-failed-with-restore error
    And the database content matches the pre-upgrade state

  Scenario: Failed application startup restores from snapshot
    Given all migrations have been applied successfully
    When building application state fails
    Then the databases are restored to the pre-migration snapshot
    And the engine reports a boot-failed-with-restore error
    And the previous binary version can boot against the restored database

  Scenario: Restore removes WAL and SHM sidecars
    Given a snapshot was restored after a failed upgrade
    Then no WAL or SHM sidecar files remain
    And the restored database is in rollback journal mode

  # --- Restore failure ---

  Scenario: Failed restore produces a distinct error
    Given a boot failure has occurred
    And the snapshot restore also fails
    Then the engine reports a restore-failed error distinct from the original error
    And the error includes both the boot failure and the restore failure

  # --- Partial output cleanup ---

  Scenario: Partial snapshot is cleaned up on failure
    Given a snapshot operation fails midway
    Then any partially written snapshot files are deleted
    And the error is propagated to the caller

  # --- Atomic boot boundary ---
  #
  # The restore boundary covers migrate → integrity → build_state.
  # Graft::run (server accepting connections) is outside — runtime
  # crashes are a different category. build_state must not perform
  # irreversible side effects (webhooks, telemetry, log rotation)
  # since those would survive a database restore.

  Scenario: Non-migration boot failure does not leave system in limbo
    Given all migrations applied successfully
    And build_state fails due to a configuration or deserialization error
    When the engine handles the failure
    Then the database is restored to ensure compatibility with any binary version
    And the user is presented with the specific boot error
    And the error includes the snapshot group identifier for manual recovery

  Scenario: Successful boot deletes the safety snapshot
    Given a successful migration and build_state sequence
    When the engine reaches the ready-to-serve state
    Then the pre-migration snapshot group is deleted
    And the snapshot directory is cleaned up

  # --- Error diagnostics ---

  Scenario: Boot failure error includes snapshot group identifier
    Given a boot failure occurred within the restore boundary
    When the error is reported to the operator
    Then the error includes the snapshot group identifier
    And the operator can locate the snapshot in the data directory

  # --- Public surface for auto-updater ---

  Scenario: Snapshot group can be taken on demand
    Given a running engine with active databases
    When an external caller requests a snapshot group
    Then a snapshot group is returned with an identifier
    And the snapshot can be restored later using that identifier
