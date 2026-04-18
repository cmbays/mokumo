Feature: Control plane error variant mapping

  Every ControlPlaneError variant maps to a fixed (ErrorCode, http_status)
  tuple. The mapping is pinned by a table-driven test so any variant added
  to the enum fails to compile unless the fixture is extended. Both the
  HTTP adapter (services/api merge) and the UDS adapter
  (mokumo-admin-adapter) must return the same tuple for a given variant.

  # This is the Wave 0 refactor safety net. It catches two classes of
  # regression: a new variant added without a mapping, and a mapping
  # drifted between the two adapters.

  Scenario Outline: ControlPlaneError maps to the pinned code and status
    Given a control plane handler that returns <variant>
    When the HTTP adapter renders the response
    Then the response code is "<error_code>"
    And the response http status is <http_status>
    When the UDS adapter renders the response
    Then the response code is "<error_code>"
    And the response http status is <http_status>

    Examples:
      | variant             | error_code           | http_status |
      | NotFound            | not_found            | 404         |
      | AlreadyBootstrapped | already_bootstrapped | 409         |
      | LastAdminProtected  | conflict             | 409         |
      | Validation          | validation_error     | 400         |
      | PermissionDenied    | forbidden            | 403         |
      | Internal            | internal_error       | 500         |

  # --- Exhaustiveness guard ---

  Scenario: Every ControlPlaneError variant appears in the mapping fixture
    Given the ControlPlaneError enum
    When the variant exhaustiveness test runs
    Then every variant has exactly one row in the mapping fixture
    And the test fails if a new variant is added without updating the fixture
