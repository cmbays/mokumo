# Smoke-suite setup-wizard prelude — completes the first-admin setup.
#
# Runs after the cold boot has produced a `Setup token: <uuid>` line on
# `mokumo-server` stderr. The moon.yml smoke task captures that token
# from the stderr file and passes it to hurl via `--variable
# setup_token=<uuid>` so this file can use the canonical
# `tests/api/envs/ci.env` for `admin_email`, `admin_password`,
# `admin_name`, and `shop_name` — no parallel hardcoded credentials.
#
# Side effects (committed inside the handler at
# `crates/mokumo-shop/src/setup.rs`):
#   1. admin user created in the auth profile DB (auth_profile_kind ==
#      Production for Mokumo) atomically with 10 recovery codes;
#   2. settings.setup_complete row written ('true');
#   3. shop_settings.shop_name persisted;
#   4. <data_dir>/active_profile flipped to "production".
#
# After this prelude succeeds, demo auto-login is disabled and every
# protected route requires a real session cookie.
#
# Uses variables: host, admin_email, admin_password, admin_name, shop_name,
#                 setup_token (passed at invocation).

POST http://{{host}}/api/setup
Content-Type: application/json
{
    "setup_token": "{{setup_token}}",
    "admin_email": "{{admin_email}}",
    "admin_name": "{{admin_name}}",
    "admin_password": "{{admin_password}}",
    "shop_name": "{{shop_name}}"
}

HTTP 201
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.recovery_codes" isCollection
jsonpath "$.recovery_codes" count == 10
