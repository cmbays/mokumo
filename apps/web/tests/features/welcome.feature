@wip
Feature: Welcome screen

  On a fresh install, the root page redirects to the welcome screen.
  The user chooses between exploring demo data or setting up their shop.
  Either choice triggers a profile switch and then lands in the app.

  # --- First-launch routing ---

  Scenario: Fresh install redirects to welcome screen
    Given the server reports is_first_launch as true
    When I navigate to "/"
    Then I am redirected to "/welcome"
    And I see the welcome screen

  Scenario: Returning user is not redirected to welcome
    Given the server reports is_first_launch as false
    When I navigate to "/"
    Then I am not redirected to "/welcome"

  # --- Welcome screen content ---

  Scenario: Welcome screen shows both CTAs
    Given I am on the welcome screen
    Then I see a "Set Up My Shop" button
    And I see an "Explore Demo" button

  Scenario: "Set Up My Shop" is the primary button
    Given I am on the welcome screen
    Then the "Set Up My Shop" button has primary styling
    And the "Explore Demo" button has secondary/outline styling

  # --- Explore Demo flow ---

  Scenario: Clicking "Explore Demo" switches to demo profile and enters the app
    Given I am on the welcome screen
    When I click "Explore Demo"
    Then a profile switch request is sent for the demo profile
    And I am redirected to "/"
    And the app is running in demo mode

  Scenario: Loading state appears while demo switch is in flight
    Given I am on the welcome screen
    When I click "Explore Demo"
    Then a loading indicator appears
    And both buttons are disabled

  # --- Set Up My Shop flow ---

  Scenario: Clicking "Set Up My Shop" switches to production profile and enters the app
    Given I am on the welcome screen
    When I click "Set Up My Shop"
    Then a profile switch request is sent for the production profile
    And I am redirected to "/"

  # --- Tauri startup race ---

  Scenario: Welcome screen shows a startup message while server is waking up
    Given the Mokumo server has not yet responded to setup-status
    When I arrive at the welcome screen
    Then I see a "Starting up..." message
    And both CTAs are hidden until the server responds

  Scenario: Startup message resolves into CTAs once server is ready
    Given I see the startup message on the welcome screen
    When the server responds to setup-status
    Then the "Set Up My Shop" and "Explore Demo" buttons appear
    And the startup message is no longer visible

  Scenario: After 10 failed retries an error message is shown
    Given the server does not respond to setup-status after 10 attempts
    When I am on the welcome screen
    Then I see an error message "Could not reach Mokumo"
    And I see a "Refresh" button

  # --- Tab focus guard ---

  Scenario: Returning to a stale welcome tab re-checks setup status
    Given I have the welcome screen open in a background tab
    And another session has already completed a profile switch
    When I focus the tab
    Then setup-status is re-fetched
    And I am redirected away from the welcome screen if is_first_launch is now false
