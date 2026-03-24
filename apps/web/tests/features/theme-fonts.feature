Feature: Theme fonts load on demand

  Scenario: Niji theme uses system fonts
    Given Storybook is showing a component with Niji theme
    When I inspect the computed styles
    Then the computed font-family for body text includes a system font
    And no custom woff2 font files are loaded

  Scenario: Tangerine theme loads its bundled fonts
    Given Storybook is showing a component with Niji theme
    When I select the "Tangerine" theme
    Then the computed font-family for body text includes "Inter"
    And the computed font-family for monospace text includes "JetBrains Mono"

  Scenario: Switching themes loads the correct fonts
    Given Storybook is showing a component with Tangerine theme
    When I select the "Midnight Bloom" theme
    Then the computed font-family for body text includes "Montserrat"
    And the computed font-family for serif text includes "Playfair Display"

  Scenario: Switching back to Niji reverts to system fonts
    Given Storybook is showing a component with Midnight Bloom theme
    When I select the "Niji" theme
    Then the computed font-family for body text includes a system font
