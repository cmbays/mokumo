# Auth-gated. In demo profile, the auto-login middleware authenticates the
# anonymous caller as the demo admin. In production profile, run after
# auth/login-success.hurl in a cookie-jar chain (PR 2 of mokumo#383).
GET http://{{host}}/api/diagnostics/bundle

HTTP 200
[Asserts]
header "Content-Type" contains "application/zip"
header "Content-Disposition" contains "attachment"
header "Content-Disposition" contains "mokumo-diagnostics"
bytes count > 0
