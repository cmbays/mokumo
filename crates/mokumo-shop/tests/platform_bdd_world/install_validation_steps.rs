use cucumber::{given, then, when};

use super::PlatformBddWorld;

#[given("a demo database with the admin account seeded and password set")]
async fn given_seeded_admin(w: &mut PlatformBddWorld) {
    sqlx::query(
        "INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES (?, ?, ?, 1, 1)",
    )
    .bind("admin@demo.local")
    .bind("Demo Admin")
    .bind("$argon2id$hashed_password")
    .execute(&w.pool)
    .await
    .expect("failed to insert admin user");
}

#[given("a demo database with no admin account")]
async fn given_no_admin(_w: &mut PlatformBddWorld) {
    // Default world init creates an empty database — no action needed.
}

#[given("a demo database with an admin account but no password hash stored")]
async fn given_admin_null_password(w: &mut PlatformBddWorld) {
    // Simulates a sidecar where the migration ran but no password was ever set —
    // represents an uninitialized/broken demo seed. The NOT NULL schema uses ''
    // as the sentinel for "no password stored".
    sqlx::query(
        "INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES (?, ?, '', 1, 1)",
    )
    .bind("admin@demo.local")
    .bind("Demo Admin")
    .execute(&w.pool)
    .await
    .expect("failed to insert admin user with empty password_hash");
}

#[given("a demo database with an admin account and an empty password hash")]
async fn given_admin_empty_password(w: &mut PlatformBddWorld) {
    // Same boundary as `given_admin_null_password`: both exercise the `password_hash = ''`
    // path of validate_installation(). The two steps exist because the feature file
    // models them as distinct scenarios ("not stored" vs. "stored but empty") even though
    // the schema collapses both to `''` due to the NOT NULL constraint.
    sqlx::query(
        "INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES (?, ?, '', 1, 1)",
    )
    .bind("admin@demo.local")
    .bind("Demo Admin")
    .execute(&w.pool)
    .await
    .expect("failed to insert admin user with empty password_hash");
}

#[given("a demo database with an admin account that is soft-deleted")]
async fn given_admin_soft_deleted(w: &mut PlatformBddWorld) {
    sqlx::query(
        "INSERT INTO users (email, name, password_hash, role_id, is_active, deleted_at) VALUES (?, ?, ?, 1, 1, '2026-01-01T00:00:00Z')",
    )
    .bind("admin@demo.local")
    .bind("Demo Admin")
    .bind("$argon2id$hashed_password")
    .execute(&w.pool)
    .await
    .expect("failed to insert soft-deleted admin user");
}

#[given("a demo database with an admin account that is inactive")]
async fn given_admin_inactive(w: &mut PlatformBddWorld) {
    sqlx::query(
        "INSERT INTO users (email, name, password_hash, role_id, is_active) VALUES (?, ?, ?, 1, 0)",
    )
    .bind("admin@demo.local")
    .bind("Demo Admin")
    .bind("$argon2id$hashed_password")
    .execute(&w.pool)
    .await
    .expect("failed to insert inactive admin user");
}

#[when("the installation is validated against that database")]
async fn when_validate(w: &mut PlatformBddWorld) {
    w.last_validation_result = Some(kikan::db::validate_installation(&w.db).await);
}

#[then("the validation passes")]
async fn then_passes(w: &mut PlatformBddWorld) {
    assert_eq!(
        w.last_validation_result,
        Some(true),
        "Expected validation to pass"
    );
}

#[then("the validation fails")]
async fn then_fails(w: &mut PlatformBddWorld) {
    assert_eq!(
        w.last_validation_result,
        Some(false),
        "Expected validation to fail"
    );
}
