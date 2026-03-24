Feature: Dark mode toggle in Storybook

  Scenario: Toggle dark mode on
    Given Storybook is showing a component in light mode
    When I toggle dark mode on
    Then the "--background" CSS variable resolves to a dark value
    And the root element has the "dark" class

  Scenario: Toggle dark mode off
    Given Storybook is showing a component in dark mode
    When I toggle dark mode off
    Then the "--background" CSS variable resolves to a light value
    And the root element does not have the "dark" class
