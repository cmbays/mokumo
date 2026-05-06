use cucumber::World as _;

#[path = "api_bdd_world/mod.rs"]
mod api_bdd_world;

/// Tags that exempt a scenario from the fail-on-skipped gate.
const SKIP_EXEMPT_TAGS: &[&str] = &["wip", "allow.skipped", "future"];

fn is_exempt(tags: &[String]) -> bool {
    tags.iter().any(|t| SKIP_EXEMPT_TAGS.contains(&t.as_str()))
}

#[tokio::main]
async fn main() {
    // mokumo#655: open the JSONL sink before any scenario runs so the
    // `before(scenario)` hook below and the per-request capture layer
    // share one writer for the whole harness run.
    api_bdd_world::scenario_coverage::init_run("api_bdd");

    api_bdd_world::ApiWorld::cucumber()
        .fail_on_skipped_with(|feature, rule, scenario| {
            !is_exempt(&feature.tags)
                && rule.is_none_or(|r| !is_exempt(&r.tags))
                && !is_exempt(&scenario.tags)
        })
        .before(|feature, _rule, scenario, world| {
            // Stamp the World's recorder with the scenario about to run.
            // The capture middleware reads this slot on every request.
            // `gherkin::Feature::path` is `Option<PathBuf>` — fall back
            // to the title when the feature was loaded inline.
            let info = api_bdd_world::scenario_coverage::ScenarioInfo {
                feature_path: feature
                    .path
                    .as_ref()
                    .map(|p| p.display().to_string())
                    .unwrap_or_default(),
                feature_title: feature.name.clone(),
                scenario_name: scenario.name.clone(),
            };
            Box::pin(async move {
                world.scenario_recorder.set(info);
            })
        })
        .after(|_feature, _rule, _scenario, _ev, world| {
            Box::pin(async move {
                if let Some(w) = world {
                    w.scenario_recorder.clear();
                }
                api_bdd_world::scenario_coverage::flush_global();
            })
        })
        .filter_run("tests/api_features", |feature, _, sc| {
            let dominated_by_wip =
                feature.tags.iter().any(|t| t == "wip") || sc.tags.iter().any(|t| t == "wip");
            !dominated_by_wip
        })
        .await;
}
