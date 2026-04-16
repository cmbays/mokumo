Feature: ImmediateScheduler runs jobs inline for tests
  As a test author writing BDD for a vertical that uses the scheduler
  I want an ImmediateScheduler that runs schedule_after(Duration::ZERO) synchronously
  So that tests can assert on job effects without waiting for wall-clock time

  Background:
    Given an ImmediateScheduler instance
    And a counter initialized to 0

  Scenario: schedule_after with zero duration runs the job inline
    When schedule_after(Duration::ZERO) is called with a job that increments the counter
    Then the counter equals 1 immediately after the schedule call returns

  Scenario: schedule_after with non-zero duration is deferred
    When schedule_after(Duration::from_secs(60)) is called with a job
    Then the job has not executed
    And the scheduler reports the job as pending

  Scenario: Multiple inline jobs execute in order
    When an inline job appending "a" to the log is scheduled
    And an inline job appending "b" to the log is scheduled
    Then the log equals "ab"
