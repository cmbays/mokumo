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

  Scenario: Shop name card shows name and mDNS slug when shop name is set
    Given the server-info API returns LAN status
    And the shop name is "Stitch & Screen"
    When I navigate to the Shop settings page
    Then I see "Stitch & Screen"
    And I see "stitch-screen.local"

  Scenario: Shop name card shows placeholder when no shop name is configured
    Given the server-info API returns LAN status
    And no shop name is configured
    When I navigate to the Shop settings page
    Then I see "No shop name set yet."
    And I see a "Switch to My Shop" button

  Scenario: Shop settings LAN card shows error when server-info API fails
    Given the server-info API returns an error
    When I navigate to the Shop settings page
    Then I see "Unable to fetch server info"
