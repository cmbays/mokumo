# POST /api/platform/v1/auth/recover/complete
#
# Canonical kikan recovery-session redemption. Validates a 6-digit PIN
# against an opaque session id, updates the user's password on success.
#
# Contract smoke test — unknown session_id → uniform 400. The full
# success path (issue session → read PIN from artifact → redeem)
# requires filesystem access and is owned by BDD.
#
# Uniform 400 is the load-bearing anti-enumeration property: all four
# failure modes (unknown session, expired session, wrong PIN, attempts
# exhausted) return the same wire shape, so callers cannot distinguish
# the rejection reason.

POST http://{{host}}/api/platform/v1/auth/recover/complete
Content-Type: application/json
{
    "recovery_session_id": "0000000000000000000000000000000000000000000000000000000000000000",
    "pin": "000000",
    "new_password": "anything-12-chars-or-more"
}

HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "validation_error"
jsonpath "$.message" exists
