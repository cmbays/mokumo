# Fixture: hurl request line for /api/fooXbar (any single char in place of
# the literal `.`). path_to_regex must escape `.` so this DOES NOT match
# the route /api/foo.bar from the diff.
GET http://{{host}}/api/fooXbar
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
