use cucumber::World as _;

#[path = "bdd_world/mod.rs"]
mod bdd_world;

#[tokio::main]
async fn main() {
    bdd_world::ApiWorld::run("tests/features").await;
}
