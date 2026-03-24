Feature: Storybook renders components with design tokens

  Scenario: Storybook boots and renders a component with Niji theme
    Given Storybook is running
    When I view a Button story
    Then the "--primary" CSS variable is defined on the root element
    And the Button is visible and interactive

  Scenario: Storybook loads design system styles
    Given Storybook is running
    When I view any component story
    Then the root element has a computed "--background" CSS variable
    And Tailwind utility classes resolve to expected CSS properties
