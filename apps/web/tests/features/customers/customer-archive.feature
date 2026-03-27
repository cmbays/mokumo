Feature: Customer archiving

  Customers are soft-deleted (archived) rather than permanently removed.
  A confirmation dialog guards the action to prevent accidental data loss.
  Archived customers disappear from the default list view but remain
  accessible via the show-deleted toggle.

  Scenario: Archive button on the detail page opens a confirmation dialog
    Given I am on the detail page for customer "Acme Printing"
    When I click "Archive"
    Then a confirmation dialog appears

  Scenario: Confirming archive from the detail page redirects to the list
    Given I am on the detail page for customer "Acme Printing"
    And I click "Archive"
    And a confirmation dialog appears
    When I confirm the archive
    Then I am redirected to the Customers page

  Scenario: Archived customer reappears with the show-deleted toggle
    Given "Acme Printing" has been archived
    And I am on the Customers page
    When I toggle "Show archived"
    Then "Acme Printing" appears in the table

  @wip
  Scenario: Archive action in list row opens a confirmation dialog
    Given I am on the Customers page
    When I open the action menu for "Acme Printing"
    And I click "Archive"
    Then a confirmation dialog appears

  @wip
  Scenario: Cancelling the confirmation returns without archiving
    Given the confirmation dialog is open for archiving "Acme Printing"
    When I cancel the dialog
    Then "Acme Printing" is still in the customer list
