Feature: Pricing calculations

  The pricing service computes per-piece prices, margins,
  setup fees, and tier-based discounts for screen print
  and DTF decoration methods.

  Rule: Margins reflect true profitability

    Scenario Outline: Margin indicator from revenue and cost breakdown
      Given revenue of <revenue> with garment cost <garment>, ink cost <ink>, and overhead <overhead>
      When I calculate the margin
      Then the margin percentage is <margin>
      And the margin indicator is "<indicator>"

      Examples:
        | revenue | garment | ink  | overhead | margin | indicator    |
        | 10.00   | 1.00    | 1.00 | 1.00     | 70.0   | healthy      |
        | 10.00   | 3.00    | 2.00 | 3.00     | 20.0   | caution      |
        | 10.00   | 5.00    | 3.00 | 2.00     | 0.0    | unprofitable |
        | 10.00   | 5.00    | 4.00 | 3.00     | -20.0  | unprofitable |

  Rule: Screen print pricing uses quantity tiers

    Scenario: Larger quantities reduce per-piece price
      Given a screen print pricing template
      When I price 24 pieces with 1 color at "front"
      And I price 72 pieces with 1 color at "front"
      Then the 72-piece per-unit price is less than the 24-piece price

    Scenario: Additional colors increase price
      Given a screen print pricing template
      When I price 48 pieces with 1 color at "front"
      And I price 48 pieces with 3 colors at "front"
      Then the 3-color price is higher than the 1-color price

    Scenario: Additional print locations increase price
      Given a screen print pricing template
      When I price 48 pieces with 1 color at "front"
      And I price 48 pieces with 1 color at "front" and "back"
      Then the 2-location price is higher than the 1-location price

  Rule: Setup fees scale with screens and quantity

    Scenario: Setup fees accumulate per screen
      Given a screen print pricing matrix with a per-screen fee of 25.00
      When I calculate setup fees for 4 screens on a 48-piece order
      Then the total setup fee is 100.00

    Scenario: Bulk orders waive setup fees
      Given a screen print pricing matrix with a per-screen fee of 25.00 and bulk waiver at 144 pieces
      When I calculate setup fees for 4 screens on a 200-piece order
      Then the total setup fee is 0.00

  Rule: DTF pricing varies by sheet size and customer tier

    Scenario: Larger sheet lengths cost more
      Given a DTF pricing template with multiple sheet tiers
      When I price a short sheet for a standard customer
      And I price a long sheet for a standard customer
      Then the long sheet price is higher than the short sheet price

    Scenario: Contract customers get lower prices than standard
      Given a DTF pricing template with contract pricing
      When I price a sheet for a standard customer
      And I price the same sheet for a contract customer
      Then the contract price is lower than the standard price

  Rule: Template health reflects overall margin quality

    Scenario: A well-configured template with healthy margins
      Given a screen print pricing template with profitable tiers
      When I evaluate template health
      Then the template health indicator is "healthy"
