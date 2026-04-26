# Canonical kikan platform login rate limiting smoke test.
#
# The in-memory limiter allows 10 attempts per email per 15 minutes.
# After 10 failures, the 11th attempt returns 429 rate_limited.
#
# Uses a unique email that does not exist in the database (so none of
# these trigger the DB lockout counter — they hit the "user not found"
# path and return 401 for each of the first 10 attempts).
#
# On the 11th attempt the in-memory limiter fires before the DB lookup,
# returning 429 with code "rate_limited".
#
# Note: the limiter is per-process and per-email. The shop SPA's
# /api/auth/login alias and the canonical /api/platform/v1/auth/login
# share the same kikan handler — and therefore the same limiter — so
# tests for the two URLs must use distinct fixture emails to stay
# isolated. This file uses `ratelimit-platform-smoke@smoke.invalid`;
# the legacy alias smoke uses `ratelimit-smoke-test@smoke.invalid`.
POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong1" }
HTTP 401
[Asserts]
jsonpath "$.code" == "invalid_credentials"

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong2" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong3" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong4" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong5" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong6" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong7" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong8" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong9" }
HTTP 401

POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong10" }
HTTP 401

# 11th attempt exceeds the in-memory window → 429 rate_limited
POST http://{{host}}/api/platform/v1/auth/login
Content-Type: application/json
{ "email": "ratelimit-platform-smoke@smoke.invalid", "password": "wrong11" }
HTTP 429
[Asserts]
header "Content-Type" contains "application/json"
header "Cache-Control" == "no-store"
jsonpath "$.code" == "rate_limited"
jsonpath "$.message" exists
jsonpath "$.details" == null
