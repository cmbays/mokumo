# Canonical kikan platform logout. Returns 204 with no body.
# Run after platform/auth/login-success.hurl in a chained smoke run, or
# unauthenticated to exercise the no-session path (still returns 204).
POST http://{{host}}/api/platform/v1/auth/logout

HTTP 204
