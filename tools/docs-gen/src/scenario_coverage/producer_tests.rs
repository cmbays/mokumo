//! Producer pipeline tests — exercise the join logic with fixture data.

use super::*;
use crate::coverage::route_walker::RouteEntry;
use std::path::PathBuf;

fn route(crate_name: &str, method: &str, path: &str) -> RouteEntry {
    RouteEntry {
        method: method.into(),
        path: path.into(),
        rust_path: format!(
            "{crate_name}::{}",
            path.trim_start_matches('/').replace('/', "::")
        ),
        crate_name: crate_name.into(),
        source_file: PathBuf::from(format!("crates/{crate_name}/src/lib.rs")),
        source_line: 1,
    }
}

fn jsonl_row(method: &str, matched_path: &str, scenario: &str, status_class: &str) -> Row {
    Row {
        feature_path: "f.feature".into(),
        feature_title: "F".into(),
        scenario: scenario.into(),
        method: method.into(),
        matched_path: matched_path.into(),
        status: match status_class {
            "happy" => 200,
            "error_4xx" => 400,
            "error_5xx" => 500,
            _ => 0,
        },
        status_class: status_class.into(),
    }
}

#[test]
fn join_buckets_scenarios_by_status_class() {
    let routes = vec![route("mokumo-shop", "GET", "/api/customers")];
    let rows = vec![
        jsonl_row("GET", "/api/customers", "list returns all", "happy"),
        jsonl_row("GET", "/api/customers", "rejects unauth", "error_4xx"),
        jsonl_row("GET", "/api/customers", "list returns all", "happy"), // dedupe
    ];
    let (by_crate, orphans) = join_routes_with_observations(routes, &rows);
    assert!(orphans.is_empty());
    assert_eq!(by_crate.len(), 1);
    let h = &by_crate[0].handlers[0];
    assert_eq!(h.happy, vec!["list returns all".to_string()]);
    assert_eq!(h.error_4xx, vec!["rejects unauth".to_string()]);
    assert!(h.error_5xx.is_empty());
}

#[test]
fn join_emits_orphan_for_unwalked_path() {
    let routes = vec![route("mokumo-shop", "GET", "/api/customers")];
    let rows = vec![jsonl_row("GET", "/api/missing", "ghost", "happy")];
    let (by_crate, orphans) = join_routes_with_observations(routes, &rows);
    assert_eq!(by_crate.len(), 1);
    let h = &by_crate[0].handlers[0];
    assert!(h.happy.is_empty()); // walked route, but no matching observation
    assert_eq!(orphans.len(), 1);
    assert_eq!(orphans[0].method, "GET");
    assert_eq!(orphans[0].matched_path, "/api/missing");
    assert_eq!(orphans[0].example_scenarios, vec!["ghost".to_string()]);
}

#[test]
fn join_dedupe_within_orphan_examples() {
    let routes = Vec::new();
    let rows = vec![
        jsonl_row("GET", "/api/missing", "scenario-a", "happy"),
        jsonl_row("GET", "/api/missing", "scenario-a", "error_4xx"),
        jsonl_row("GET", "/api/missing", "scenario-b", "happy"),
    ];
    let (_, orphans) = join_routes_with_observations(routes, &rows);
    assert_eq!(orphans.len(), 1);
    assert_eq!(orphans[0].example_scenarios.len(), 2);
    assert!(orphans[0].example_scenarios.contains(&"scenario-a".into()));
    assert!(orphans[0].example_scenarios.contains(&"scenario-b".into()));
}

#[test]
fn join_orphan_examples_are_truncated() {
    let routes = Vec::new();
    let rows: Vec<Row> = (0..ORPHAN_EXAMPLE_LIMIT + 5)
        .map(|i| jsonl_row("GET", "/api/missing", &format!("scenario-{i}"), "happy"))
        .collect();
    let (_, orphans) = join_routes_with_observations(routes, &rows);
    assert_eq!(orphans[0].example_scenarios.len(), ORPHAN_EXAMPLE_LIMIT);
}

#[test]
fn join_method_match_is_case_insensitive_on_the_observed_side() {
    let routes = vec![route("x", "POST", "/api/x")];
    let rows = vec![jsonl_row("post", "/api/x", "s", "happy")];
    let (by_crate, orphans) = join_routes_with_observations(routes, &rows);
    assert!(orphans.is_empty());
    assert_eq!(by_crate[0].handlers[0].happy, vec!["s".to_string()]);
}

#[test]
fn join_groups_handlers_by_crate() {
    let routes = vec![
        route("kikan", "GET", "/api/health"),
        route("mokumo-shop", "GET", "/api/customers"),
    ];
    let rows = Vec::new();
    let (by_crate, _) = join_routes_with_observations(routes, &rows);
    assert_eq!(by_crate.len(), 2);
    assert_eq!(by_crate[0].crate_name, "kikan");
    assert_eq!(by_crate[1].crate_name, "mokumo-shop");
}

#[test]
fn join_collapses_duplicate_walker_emissions_for_same_route() {
    // The walker can emit the same (method, path, crate) twice when a
    // sub-router is mounted via `.merge(...)` and walked from both sites.
    let routes = vec![
        route("mokumo-shop", "GET", "/api/customers"),
        route("mokumo-shop", "GET", "/api/customers"),
    ];
    let rows = vec![jsonl_row("GET", "/api/customers", "s", "happy")];
    let (by_crate, _) = join_routes_with_observations(routes, &rows);
    assert_eq!(by_crate[0].handlers.len(), 1);
}
