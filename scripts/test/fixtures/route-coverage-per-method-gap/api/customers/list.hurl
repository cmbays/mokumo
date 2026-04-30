# Fixture: only GET covered; POST is the gap the per-method check must detect.
GET http://{{host}}/api/customers
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
