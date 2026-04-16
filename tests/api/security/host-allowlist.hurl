# DNS-rebinding defense: Host header must be loopback.
# Requests with non-allowlisted Host are rejected with 403.

# Evil host is rejected
GET http://{{host}}/api/health
Host: evil.com
HTTP 403
[Asserts]
header "Content-Type" contains "application/json"
header "Cache-Control" == "no-store"
jsonpath "$.code" == "HOST_NOT_ALLOWED"
jsonpath "$.message" == "Host header not allowed"
jsonpath "$.details" == null

# Subdomain spoofing with loopback prefix is rejected
GET http://{{host}}/api/health
Host: 127.0.0.1.evil.com
HTTP 403
[Asserts]
jsonpath "$.code" == "HOST_NOT_ALLOWED"

# Loopback with port is accepted
GET http://{{host}}/api/health
Host: 127.0.0.1:6565
HTTP 200
