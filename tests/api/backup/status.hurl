# Backup status returns empty arrays when no backups exist (fresh test server).
GET http://{{host}}/api/backup-status

HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.production" exists
jsonpath "$.production.backups" isCollection
jsonpath "$.demo" exists
jsonpath "$.demo.backups" isCollection
