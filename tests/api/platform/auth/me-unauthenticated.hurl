# Canonical kikan platform /me without a session must return 401.
GET http://{{host}}/api/platform/v1/auth/me

HTTP 401
[Asserts]
jsonpath "$.code" == "unauthorized"
jsonpath "$.message" exists
