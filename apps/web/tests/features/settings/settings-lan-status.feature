Feature: Settings page displays LAN status information

  The Shop settings tab shows LAN access details so the shop owner
  can share the local URL with devices on the same network.

  Background:
    Given the server-info API returns LAN status

  Scenario: LAN Access card is visible on the Shop settings page
    When I navigate to the Shop settings page
    Then I see the "LAN Access" card

  Scenario: LAN status badge shows active when mDNS is running
    When I navigate to the Shop settings page
    Then I see an "Active" status badge

  Scenario: LAN URL is displayed
    When I navigate to the Shop settings page
    Then I see the LAN URL "http://mokumo.local:3000"

  Scenario: IP address URL is displayed
    When I navigate to the Shop settings page
    Then I see the IP address "http://192.168.1.42:3000"

  Scenario: Port number is part of the displayed URLs
    When I navigate to the Shop settings page
    Then the displayed URLs include port "3000"

  Scenario: mDNS hostname is part of the LAN URL
    When I navigate to the Shop settings page
    Then the LAN URL contains the mDNS hostname "mokumo.local"

  Scenario: LAN status shows disabled when mDNS is inactive
    Given the server-info API returns mDNS inactive
    When I navigate to the Shop settings page
    Then I see a "Disabled" status badge
