# Smoke-suite Phase 2 prelude — single admin login.
#
# `mokumo-server serve` boots into the demo profile by default, where the
# demo-auto-login middleware carries every data-plane route that is mounted
# behind it. The canonical /api/platform/v1/auth/* surface is intentionally
# OUTSIDE that middleware (admin-UI sessions are always explicit), and the
# admin-gated `/api/users/*` mounts are mount-order-fragile against
# demo-auto-login. Both classes need an explicit admin session.
#
# The shop:smoke task runs hurl in two stages: stage 1 covers everything
# carried by demo-auto-login or unauthenticated; stage 1.5 runs this file
# with --cookie-jar so the resulting `mokumo_session` lands in a temp file;
# stage 2 runs the explicit-cookie suite with --cookie reading that file.
#
# Per-email rate limit (10 attempts / 15 min, kikan::rate_limit) makes
# embedded per-file logins fragile — at the time of writing the suite
# would issue 10 admin@demo.local logins per smoke run, hitting the absolute
# edge. This single shared login keeps the count at one regardless of how
# many explicit-cookie tests are added later.
#
# Uses variables: host, admin_email, admin_password.

POST http://{{host}}/api/auth/login
Content-Type: application/json
{
    "email": "{{admin_email}}",
    "password": "{{admin_password}}"
}

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
cookie "mokumo_session" exists
