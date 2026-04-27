Feature: PIN-Based Password Recovery

  When an admin forgets their password, they can request a recovery file to be
  placed on the server's Desktop. The file contains a 6-digit PIN valid for
  15 minutes. The PIN is never returned in the API response — it must be read
  from the file on the local machine.

  Scenario: Valid email triggers PIN generation and recovery file placement
    Given an admin user exists
    When the user requests a password reset via file drop
    Then a recovery file is placed on the user's Desktop
    And the file contains a PIN for resetting the password

  Scenario: Unknown email returns a generic success to prevent account enumeration
    When the user requests a password reset for an unknown email
    Then a generic success response is returned

  Scenario: Valid PIN resets password and clears the pending reset
    Given a recovery PIN has been generated
    When the user enters the correct PIN with a new password
    Then the password is updated
    And the recovery PIN is invalidated

  Scenario: Invalid PIN is rejected but the valid PIN remains usable
    Given a recovery PIN has been generated
    When the user enters an incorrect PIN
    Then the reset is rejected
    And the valid PIN remains usable

  Scenario: Expired PIN is rejected
    Given a recovery PIN was generated more than 15 minutes ago
    When the user enters the PIN with a new password
    Then the reset is rejected as expired

  Scenario: Reset attempt with no prior request is rejected
    Given an admin user exists
    When the user enters an incorrect PIN
    Then the reset is rejected

  # Exercises the atomic remove-check-reinsert primitive in
  # kikan::control_plane::auth::recover_complete: every wrong PIN
  # increments the in-memory attempts counter (DashMap reinsert with
  # attempts += 1); on the 3rd consecutive wrong PIN the entry is
  # consumed and not reinserted, so the original valid PIN can no
  # longer redeem the session.
  Scenario: Three wrong PINs exhaust attempts and destroy the session
    Given a recovery PIN has been generated
    When the user enters an incorrect PIN 3 times
    Then the original valid PIN no longer redeems the session

  Scenario: Two wrong PINs leave the valid PIN usable
    Given a recovery PIN has been generated
    When the user enters an incorrect PIN 2 times
    And the user enters the correct PIN with a new password
    Then the password is updated

  @wip
  Scenario: Excessive reset requests are rate limited
    Given an admin user exists
    When the user makes 6 forgot-password requests within 15 minutes
    Then the 6th request is rejected
