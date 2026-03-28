Feature: Customer activity log

  The Activity tab on a customer's detail page shows a chronological
  record of every mutation — creation, updates, and archival.

  Scenario: New customer shows only a creation entry
    Given customer "Fresh Start" was just created
    When I view the Activity tab for "Fresh Start"
    Then I see exactly one activity entry
    And the entry shows a "Created" action

  Scenario: Activity tab shows entries after create and update
    Given customer "Acme Printing" has been created and then updated
    When I navigate to the Activity tab for "Acme Printing"
    Then I see activity entries for both actions

  Scenario: Each entry shows the action type and a timestamp
    Given customer "Acme Printing" was recently created
    When I view the Activity tab
    Then the most recent entry shows a "Created" action
    And the entry shows a recent timestamp

  @wip
  Scenario: Update entries describe what changed
    Given customer "Acme Printing" had their email updated
    When I view the Activity tab
    Then I see an update entry that describes the email change

  @wip
  Scenario: Activity list paginates for customers with long histories
    Given customer "Acme Printing" has more activity entries than fit on one page
    When I view the Activity tab
    Then I see pagination controls
    And I can navigate to the next page of activity entries
