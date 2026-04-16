Feature: Migration Ordering

  Kikan resolves migration dependencies using a directed acyclic graph.
  Migrations from all grafts are collected, sorted topologically, and
  executed in a deterministic order. Dependency violations are caught
  before any migration runs.

  # --- Topological ordering ---

  Scenario: Migrations run in dependency order
    Given a graft with migrations A, B, and C
    And migration C depends on B
    And migration B depends on A
    When the migration plan is resolved
    Then the execution order is A, B, C

  Scenario: Independent migrations run in deterministic order
    Given two grafts each with independent migrations
    When the migration plan is resolved multiple times
    Then the order is identical every time

  Scenario: Cross-target migrations respect priority
    Given a Meta-target migration and a PerProfile-target migration
    When the migration plan is resolved
    Then the Meta migration is ordered before the PerProfile migration

  Scenario: Diamond dependency is resolved without duplication
    Given migrations A, B, C, and D
    And B depends on A
    And C depends on A
    And D depends on B and C
    When the migration plan is resolved
    Then each migration appears exactly once
    And A runs before B, C, and D
    And D runs after both B and C

  # --- Dependency violations ---

  Scenario: Circular dependency is rejected
    Given migrations A and B
    And A depends on B
    And B depends on A
    When the migration plan is resolved
    Then resolution fails with a cycle error naming A and B

  Scenario: Three-node cycle in a larger graph is detected
    Given five migrations where three form a cycle
    When the migration plan is resolved
    Then resolution fails with a cycle error
    And no migrations have been executed

  Scenario: Dangling dependency reference is rejected
    Given a migration that depends on a non-existent migration
    When the migration plan is resolved
    Then resolution fails with a dangling reference error

  Scenario: Duplicate migration name within a graft is rejected
    Given a graft that registers two migrations with the same name
    When the migration plan is resolved
    Then resolution fails with a duplicate migration error

  # --- Cross-target validation ---

  Scenario: PerProfile migration may depend on a Meta migration
    Given a Meta-target migration M and a PerProfile-target migration P
    And P declares a dependency on M
    When the migration plan is resolved
    Then the plan is valid
    And M is ordered before P

  Scenario: Meta migration depending on PerProfile is rejected
    Given a Meta-target migration M and a PerProfile-target migration P
    And M declares a dependency on P
    When the migration plan is resolved
    Then resolution fails with a cross-target dependency error
    And the error explains that Meta migrations cannot depend on PerProfile
