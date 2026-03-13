Feature: Money arithmetic

  Rule: Money values are created from numeric input

    Scenario: Create a money value from a number
      Given a monetary value of 10
      Then the value exists
