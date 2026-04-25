Feature: Migration target routing

  The migration runner dispatches each migration to the pool whose
  role matches `Migration::target()`. Meta-target migrations run
  against the meta.db pool exactly once per install. PerProfile-target
  migrations run against each per-profile pool. Each database carries
  its own `kikan_migrations` history so no central coordinator can
  drift from the truth on disk.

  Scenario: a Meta-target migration runs against the meta pool, not the per-profile pool
    Given a meta pool and a per-profile pool
    And a Meta-target migration that creates a "meta_only_table" table
    When migrations are dispatched by target
    Then the meta pool contains the "meta_only_table" table
    And the per-profile pool does not contain the "meta_only_table" table
    And meta pool kikan_migrations records the migration once

  Scenario: a PerProfile-target migration runs against the per-profile pool, not the meta pool
    Given a meta pool and a per-profile pool
    And a PerProfile-target migration that creates a "per_profile_only_table" table
    When migrations are dispatched by target
    Then the per-profile pool contains the "per_profile_only_table" table
    And the meta pool does not contain the "per_profile_only_table" table
    And per-profile pool kikan_migrations records the migration once

  Scenario: a PerProfile-target migration is applied once per per-profile pool
    Given a meta pool and two per-profile pools
    And a PerProfile-target migration that creates a "per_profile_only_table" table
    When migrations are dispatched by target
    Then both per-profile pools contain the "per_profile_only_table" table
    And both per-profile pools have one kikan_migrations row for that migration
