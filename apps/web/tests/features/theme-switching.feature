Feature: Theme switching between 6 themes

  Scenario: Switch to Tangerine theme
    Given Storybook is showing a component with Niji theme
    When I select the "Tangerine" theme
    Then the "--primary" CSS variable changes to the Tangerine value

  Scenario: Switch to Midnight Bloom theme
    Given Storybook is showing a component with Niji theme
    When I select the "Midnight Bloom" theme
    Then the "--primary" CSS variable changes to the Midnight Bloom value

  Scenario: Switch back to Niji (default) theme
    Given Storybook is showing a component with Tangerine theme
    When I select the "Niji" theme
    Then the "--primary" CSS variable changes to the Niji value

  Scenario: Theme switching preserves dark mode
    Given Storybook is showing a component in dark mode with Niji theme
    When I select the "Solar Dusk" theme
    Then the "--primary" CSS variable changes to the Solar Dusk value
    And the root element still has the "dark" class

  Scenario Outline: All 6 themes are available in the switcher
    When I open the theme switcher
    Then "<theme>" is listed as an option

    Examples:
      | theme           |
      | Niji            |
      | Tangerine       |
      | Midnight Bloom  |
      | Solar Dusk      |
      | Soft Pop        |
      | Sunset Horizon  |
