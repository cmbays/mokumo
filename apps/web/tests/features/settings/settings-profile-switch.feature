@wip
Feature: Profile switch shortcut in Settings

  The System Settings page contains a shortcut button that opens the
  sidebar profile switcher. This provides discoverability for users
  who look in Settings for profile-switching controls.

  # --- Button presence ---

  Scenario: Profile switcher shortcut appears in demo mode
    Given the server is running in demo mode
    When I navigate to the System Settings page
    Then I see an "Open Profile Switcher" button

  Scenario: Profile switcher shortcut appears in production mode
    Given the server is running in production mode
    When I navigate to the System Settings page
    Then I see an "Open Profile Switcher" button

  # --- Button action ---

  Scenario: Clicking the shortcut opens the sidebar profile switcher
    Given I am on the System Settings page
    When I click "Open Profile Switcher"
    Then the sidebar profile switcher dropdown opens
    And I remain on the System Settings page

  # --- Coexistence with demo reset ---

  Scenario: Demo mode shows both Reset Demo Data and profile switcher shortcut
    Given the server is running in demo mode
    When I navigate to the System Settings page
    Then I see a "Reset Demo Data" button
    And I see an "Open Profile Switcher" button

  Scenario: Production mode shows only the profile switcher shortcut
    Given the server is running in production mode
    When I navigate to the System Settings page
    Then I do not see a "Reset Demo Data" button
    And I see an "Open Profile Switcher" button
