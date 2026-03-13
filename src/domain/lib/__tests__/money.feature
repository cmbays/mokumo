Feature: Money arithmetic

  Money values wrap big.js to guarantee precision in financial
  calculations. All currency amounts flow through this module.

  Rule: Financial calculations must never lose precision

    Scenario: Integer amounts preserve exact value
      Given a monetary value of 100
      When I convert to a fixed decimal
      Then the result is "100.00"

    Scenario: Fractional cents preserve internal precision
      Given a monetary value of 1.005
      When I convert to a fixed decimal
      Then the result is "1.01"

    Scenario: Very small amounts do not collapse to zero
      Given a monetary value of 0.001
      When I convert to a number
      Then the numeric result is 0.001

    Scenario: Arithmetic between money values is precise
      Given a monetary value of 0.1
      And another monetary value of 0.2
      When I add the two values
      Then the result is "0.30"

    Scenario: Subtraction does not produce floating-point drift
      Given a monetary value of 1.0
      And another monetary value of 0.9
      When I subtract the second from the first
      Then the result is "0.10"

  Rule: Rounding follows banker-safe half-up convention

    Scenario Outline: Half-up rounding at two decimal places
      Given a monetary value of <input>
      When I round to two decimal places
      Then the result is "<rounded>"

      Examples:
        | input  | rounded |
        | 1.005  | 1.01    |
        | 1.004  | 1.00    |
        | 1.015  | 1.02    |
        | 2.5    | 2.50    |
        | 99.999 | 100.00  |

  Rule: Currency formatting follows US locale conventions

    Scenario Outline: Standard currency format
      Given a monetary value of <amount>
      When I format as currency
      Then the formatted value is "<formatted>"

      Examples:
        | amount    | formatted      |
        | 0         | $0.00          |
        | 10        | $10.00         |
        | 1234.5    | $1,234.50      |
        | 1000000   | $1,000,000.00  |

    Scenario Outline: Compact currency format for large amounts
      Given a monetary value of <amount>
      When I format as compact currency
      Then the formatted value starts with "$"

      Examples:
        | amount   |
        | 1000     |
        | 1000000  |
