Feature: Storybook viewport presets

  Scenario Outline: Viewport resizes canvas to Mokumo breakpoints
    Given Storybook is showing a component story
    When I select the "<width>px" viewport
    Then the canvas width is <width> pixels

    Examples:
      | width |
      | 375   |
      | 640   |
      | 768   |
      | 1024  |
      | 1536  |
