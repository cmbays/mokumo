# POST /api/platform/v1/auth/recover/request
#
# Canonical kikan recovery-session issuance. Returns 200 with
# `recovery_session_id` (opaque high-entropy token) and
# `recovery_file_path` (operator-readable artifact location).
#
# Anti-enumeration: the response shape is identical for known and
# unknown emails — both return a session_id (the unknown-email case
# synthesizes one with no backing DashMap entry, so any subsequent
# /complete attempt fails uniformly with the same 400 as wrong PIN).
#
# The full success path (read PIN from artifact → /complete) requires
# filesystem access and is owned by BDD.

# Anti-enumeration: known and unknown emails produce identical
# response shape. Both calls below are smoke-tested for that uniformity;
# the harness does not need an admin_email var (it is not yet threaded
# through tests/api/envs/ci.env — see PR 2 of mokumo#383).

# 1. First call — 200 with session_id + recovery_file_path
POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{
    "email": "smoke-recover-1@smoke.invalid"
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.recovery_session_id" exists
jsonpath "$.recovery_file_path" exists

# 2. Different email — same 200 shape (anti-enum)
POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{
    "email": "smoke-recover-2@smoke.invalid"
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.recovery_session_id" exists
