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

# 1. Known email — 200 with session_id + recovery_file_path
POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{
    "email": "{{admin_email}}"
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.recovery_session_id" exists
jsonpath "$.recovery_file_path" exists

# 2. Unknown email — same 200 shape, synthesized session_id
POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{
    "email": "noone@example.com"
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.recovery_session_id" exists
