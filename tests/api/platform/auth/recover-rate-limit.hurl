# POST /api/platform/v1/auth/recover/request rate limiting smoke test.
#
# The recovery limiter allows 5 issuance attempts per email per
# 15 minutes (kikan::boot::RateLimitConfig::default). On the 6th attempt
# the limiter rejects with the uniform anti-enum 400 — same wire shape as
# unknown session / wrong PIN / expired session. The rate-limit response
# must be indistinguishable from "we already issued a session for this
# email and you ran the issuance loop too fast".
#
# Uses a fixture email that is not seeded in any profile DB. The unknown-
# email path still issues sessions (synthesised) so the limiter still
# counts the attempt — anti-enumeration uniformity again.

POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{ "email": "ratelimit-recover-smoke@smoke.invalid" }
HTTP 200

POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{ "email": "ratelimit-recover-smoke@smoke.invalid" }
HTTP 200

POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{ "email": "ratelimit-recover-smoke@smoke.invalid" }
HTTP 200

POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{ "email": "ratelimit-recover-smoke@smoke.invalid" }
HTTP 200

POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{ "email": "ratelimit-recover-smoke@smoke.invalid" }
HTTP 200

# 6th attempt exceeds the in-memory window → uniform 400 anti-enum response.
POST http://{{host}}/api/platform/v1/auth/recover/request
Content-Type: application/json
{ "email": "ratelimit-recover-smoke@smoke.invalid" }
HTTP 400
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.code" == "validation_error"
jsonpath "$.message" == "Invalid or expired recovery session"
