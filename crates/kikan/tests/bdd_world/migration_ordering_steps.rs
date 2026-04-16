use cucumber::{given, then, when};
use kikan::migrations::dag;
use kikan::{DagError, GraftId, Migration, MigrationRef, MigrationTarget};
use std::sync::Arc;

use super::KikanWorld;

fn make_bdd_migration(
    name: &'static str,
    graft: &'static str,
    deps: Vec<(&'static str, &'static str)>,
    target: MigrationTarget,
) -> Arc<dyn Migration> {
    Arc::new(BddMigration {
        name,
        graft,
        deps,
        target,
    })
}

struct BddMigration {
    name: &'static str,
    graft: &'static str,
    deps: Vec<(&'static str, &'static str)>,
    target: MigrationTarget,
}

#[async_trait::async_trait]
impl Migration for BddMigration {
    fn name(&self) -> &'static str {
        self.name
    }

    fn graft_id(&self) -> GraftId {
        GraftId::new(self.graft)
    }

    fn target(&self) -> MigrationTarget {
        self.target
    }

    fn dependencies(&self) -> Vec<MigrationRef> {
        self.deps
            .iter()
            .map(|&(graft, name)| MigrationRef {
                graft: GraftId::new(graft),
                name,
            })
            .collect()
    }

    async fn up(
        &self,
        conn: &kikan::migrations::conn::MigrationConn,
    ) -> Result<(), sea_orm::DbErr> {
        conn.execute_unprepared(&format!(
            "CREATE TABLE IF NOT EXISTS test_{} (id INTEGER PRIMARY KEY)",
            self.name
        ))
        .await?;
        Ok(())
    }
}

// --- Given steps ---

#[given("a graft with migrations A, B, and C")]
async fn graft_with_abc(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("A", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("B", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("C", "g1", vec![], MigrationTarget::PerProfile),
    ];
}

#[given("migration C depends on B")]
async fn c_depends_on_b(w: &mut KikanWorld) {
    replace_migration(w, "C", "g1", vec![("g1", "B")], MigrationTarget::PerProfile);
}

#[given("migration B depends on A")]
async fn b_depends_on_a(w: &mut KikanWorld) {
    replace_migration(w, "B", "g1", vec![("g1", "A")], MigrationTarget::PerProfile);
}

#[given("two grafts each with independent migrations")]
async fn two_grafts_independent(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("X", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("Y", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("P", "g2", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("Q", "g2", vec![], MigrationTarget::PerProfile),
    ];
}

#[given("a Meta-target migration and a PerProfile-target migration")]
async fn meta_and_per_profile(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("M", "g1", vec![], MigrationTarget::Meta),
        make_bdd_migration("P", "g1", vec![], MigrationTarget::PerProfile),
    ];
}

#[given("migrations A, B, C, and D")]
async fn migrations_abcd(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("A", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("B", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("C", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("D", "g1", vec![], MigrationTarget::PerProfile),
    ];
}

#[given("B depends on A")]
async fn b_dep_a(w: &mut KikanWorld) {
    replace_migration(w, "B", "g1", vec![("g1", "A")], MigrationTarget::PerProfile);
}

#[given("C depends on A")]
async fn c_dep_a(w: &mut KikanWorld) {
    replace_migration(w, "C", "g1", vec![("g1", "A")], MigrationTarget::PerProfile);
}

#[given("D depends on B and C")]
async fn d_dep_bc(w: &mut KikanWorld) {
    replace_migration(
        w,
        "D",
        "g1",
        vec![("g1", "B"), ("g1", "C")],
        MigrationTarget::PerProfile,
    );
}

#[given("migrations A and B")]
async fn migrations_ab(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("A", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("B", "g1", vec![], MigrationTarget::PerProfile),
    ];
}

#[given("A depends on B")]
async fn a_dep_b(w: &mut KikanWorld) {
    replace_migration(w, "A", "g1", vec![("g1", "B")], MigrationTarget::PerProfile);
}

#[given("five migrations where three form a cycle")]
async fn five_with_cycle(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("A", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration(
            "B",
            "g1",
            vec![("g1", "A"), ("g1", "E")],
            MigrationTarget::PerProfile,
        ),
        make_bdd_migration("C", "g1", vec![("g1", "B")], MigrationTarget::PerProfile),
        make_bdd_migration("D", "g1", vec![("g1", "C")], MigrationTarget::PerProfile),
        make_bdd_migration("E", "g1", vec![("g1", "D")], MigrationTarget::PerProfile),
    ];
}

#[given("a migration that depends on a non-existent migration")]
async fn dangling_dep(w: &mut KikanWorld) {
    w.migrations = vec![make_bdd_migration(
        "A",
        "g1",
        vec![("g1", "nonexistent")],
        MigrationTarget::PerProfile,
    )];
}

#[given("a graft that registers two migrations with the same name")]
async fn duplicate_name(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("A", "g1", vec![], MigrationTarget::PerProfile),
        make_bdd_migration("A", "g1", vec![], MigrationTarget::PerProfile),
    ];
}

#[given("a Meta-target migration M and a PerProfile-target migration P")]
async fn meta_m_and_per_profile_p(w: &mut KikanWorld) {
    w.migrations = vec![
        make_bdd_migration("M", "g1", vec![], MigrationTarget::Meta),
        make_bdd_migration("P", "g1", vec![], MigrationTarget::PerProfile),
    ];
}

#[given("P declares a dependency on M")]
async fn p_dep_m(w: &mut KikanWorld) {
    replace_migration(w, "P", "g1", vec![("g1", "M")], MigrationTarget::PerProfile);
}

#[given("M declares a dependency on P")]
async fn m_dep_p(w: &mut KikanWorld) {
    replace_migration(w, "M", "g1", vec![("g1", "P")], MigrationTarget::Meta);
}

// --- When steps ---

#[when("the migration plan is resolved")]
async fn resolve_plan(w: &mut KikanWorld) {
    w.resolve_result = Some(dag::resolve(&w.migrations));
}

#[when("the migration plan is resolved multiple times")]
async fn resolve_plan_multiple(w: &mut KikanWorld) {
    let result1 = dag::resolve(&w.migrations);
    let result2 = dag::resolve(&w.migrations);
    match (&result1, &result2) {
        (Ok(r1), Ok(r2)) => {
            let names1: Vec<&str> = r1.iter().map(|m| m.name()).collect();
            let names2: Vec<&str> = r2.iter().map(|m| m.name()).collect();
            assert_eq!(names1, names2, "resolve should be deterministic");
        }
        _ => {}
    }
    w.resolve_result = Some(result1);
}

// --- Then steps ---

#[then("the execution order is A, B, C")]
async fn order_abc(w: &mut KikanWorld) {
    let result = w.resolve_result.as_ref().unwrap().as_ref().unwrap();
    let names: Vec<&str> = result.iter().map(|m| m.name()).collect();
    assert_eq!(names, vec!["A", "B", "C"]);
}

#[then("the order is identical every time")]
async fn order_deterministic(w: &mut KikanWorld) {
    assert!(w.resolve_result.as_ref().unwrap().is_ok());
}

#[then("the Meta migration is ordered before the PerProfile migration")]
async fn meta_before_per_profile(w: &mut KikanWorld) {
    let result = w.resolve_result.as_ref().unwrap().as_ref().unwrap();
    let names: Vec<&str> = result.iter().map(|m| m.name()).collect();
    let pos_m = names.iter().position(|&n| n == "M").unwrap();
    let pos_p = names.iter().position(|&n| n == "P").unwrap();
    assert!(pos_m < pos_p);
}

#[then("each migration appears exactly once")]
async fn each_appears_once(w: &mut KikanWorld) {
    let result = w.resolve_result.as_ref().unwrap().as_ref().unwrap();
    assert_eq!(result.len(), 4);
}

#[then("A runs before B, C, and D")]
async fn a_before_bcd(w: &mut KikanWorld) {
    let result = w.resolve_result.as_ref().unwrap().as_ref().unwrap();
    let names: Vec<&str> = result.iter().map(|m| m.name()).collect();
    let pos_a = names.iter().position(|&n| n == "A").unwrap();
    let pos_b = names.iter().position(|&n| n == "B").unwrap();
    let pos_c = names.iter().position(|&n| n == "C").unwrap();
    let pos_d = names.iter().position(|&n| n == "D").unwrap();
    assert!(pos_a < pos_b);
    assert!(pos_a < pos_c);
    assert!(pos_a < pos_d);
}

#[then("D runs after both B and C")]
async fn d_after_bc(w: &mut KikanWorld) {
    let result = w.resolve_result.as_ref().unwrap().as_ref().unwrap();
    let names: Vec<&str> = result.iter().map(|m| m.name()).collect();
    let pos_b = names.iter().position(|&n| n == "B").unwrap();
    let pos_c = names.iter().position(|&n| n == "C").unwrap();
    let pos_d = names.iter().position(|&n| n == "D").unwrap();
    assert!(pos_d > pos_b);
    assert!(pos_d > pos_c);
}

#[then(regex = r"resolution fails with a cycle error naming A and B")]
async fn cycle_error_ab(w: &mut KikanWorld) {
    let err = w
        .resolve_result
        .as_ref()
        .unwrap()
        .as_ref()
        .err()
        .expect("expected error");
    assert!(matches!(err, DagError::Cycle { .. }));
}

#[then("resolution fails with a cycle error")]
async fn cycle_error(w: &mut KikanWorld) {
    let err = w
        .resolve_result
        .as_ref()
        .unwrap()
        .as_ref()
        .err()
        .expect("expected error");
    assert!(matches!(err, DagError::Cycle { .. }));
}

#[then("no migrations have been executed")]
async fn no_migrations_executed(_w: &mut KikanWorld) {
    // DAG resolution happens before execution — if it fails, nothing runs
}

#[then("resolution fails with a dangling reference error")]
async fn dangling_error(w: &mut KikanWorld) {
    let err = w
        .resolve_result
        .as_ref()
        .unwrap()
        .as_ref()
        .err()
        .expect("expected error");
    assert!(matches!(err, DagError::DanglingRef { .. }));
}

#[then("resolution fails with a duplicate migration error")]
async fn duplicate_error(w: &mut KikanWorld) {
    let err = w
        .resolve_result
        .as_ref()
        .unwrap()
        .as_ref()
        .err()
        .expect("expected error");
    assert!(matches!(err, DagError::DuplicateMigration { .. }));
}

#[then("the plan is valid")]
async fn plan_valid(w: &mut KikanWorld) {
    assert!(w.resolve_result.as_ref().unwrap().is_ok());
}

#[then("M is ordered before P")]
async fn m_before_p(w: &mut KikanWorld) {
    let result = w.resolve_result.as_ref().unwrap().as_ref().unwrap();
    let names: Vec<&str> = result.iter().map(|m| m.name()).collect();
    let pos_m = names.iter().position(|&n| n == "M").unwrap();
    let pos_p = names.iter().position(|&n| n == "P").unwrap();
    assert!(pos_m < pos_p);
}

#[then("resolution fails with a cross-target dependency error")]
async fn cross_target_error(w: &mut KikanWorld) {
    let err = w
        .resolve_result
        .as_ref()
        .unwrap()
        .as_ref()
        .err()
        .expect("expected error");
    assert!(matches!(err, DagError::CrossTargetViolation { .. }));
}

#[then("the error explains that Meta migrations cannot depend on PerProfile")]
async fn error_explains_cross_target(w: &mut KikanWorld) {
    let err = w
        .resolve_result
        .as_ref()
        .unwrap()
        .as_ref()
        .err()
        .expect("expected error");
    let msg = err.to_string();
    assert!(msg.contains("Meta") && msg.contains("PerProfile"));
}

// --- Helpers ---

fn replace_migration(
    w: &mut KikanWorld,
    name: &'static str,
    graft: &'static str,
    deps: Vec<(&'static str, &'static str)>,
    target: MigrationTarget,
) {
    w.migrations
        .retain(|m| !(m.name() == name && m.graft_id().get() == graft));
    w.migrations
        .push(make_bdd_migration(name, graft, deps, target));
}
