Feature: Settings page headers reflect actual page content

  System Settings and Shop Settings should have accurate, plain headers
  instead of placeholder EmptyState components or aspirational subtitles.

  # --- System Settings ---

  Scenario: System settings shows correct subtitle after EmptyState removal
    When I navigate to the System settings page
    Then I see "Demo mode and profile switching."
    And I do not see "Server configuration, backups, and system maintenance."

  # --- Shop Settings ---

  Scenario: Shop settings shows updated subtitle
    Given the server-info API returns LAN status
    When I navigate to the Shop settings page
    Then I see "Your shop details and network access."

  Scenario: Shop settings shows read-only shop name card
    Given the server-info API returns LAN status
    When I navigate to the Shop settings page
    Then I see the "Shop Name" card
