# Fixture: hurl coverage for the LAST .nest()'s new route only.
# A pre-fix script (greedy `.*\.nest\(`) captures only the last .nest()
# in routes.rs, so the new route inside the FIRST nest (/api/quotes)
# is silently skipped — coverage check passes spuriously. The fixed
# script enumerates every .nest() and detects the unresolved gap.
POST http://{{host}}/api/invoices/abc-123/void
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
