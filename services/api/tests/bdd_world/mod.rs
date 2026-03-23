use axum_test::TestServer;
use cucumber::{World, given, then, when};

use mokumo_api::{ServerConfig, build_app, ensure_data_dirs};

#[derive(Debug, World)]
#[world(init = Self::new)]
pub struct ApiWorld {
    pub server: TestServer,
    pub response: Option<axum_test::TestResponse>,
    // Hold the tempdir alive for the lifetime of the world
    _tmp: tempfile::TempDir,
}

impl ApiWorld {
    async fn new() -> Self {
        let tmp = tempfile::tempdir().expect("failed to create temp dir");
        let data_dir = tmp.path().join("bdd_test");
        ensure_data_dirs(&data_dir).expect("failed to create data dirs");

        let db_path = data_dir.join("mokumo.db");
        let database_url = format!("sqlite:{}?mode=rwc", db_path.display());
        let pool = mokumo_db::initialize_database(&database_url)
            .await
            .expect("failed to initialize database");

        let config = ServerConfig {
            port: 0,
            host: "127.0.0.1".into(),
            data_dir,
        };
        let app = build_app(&config, pool);

        Self {
            server: TestServer::new(app).expect("failed to create test server"),
            response: None,
            _tmp: tmp,
        }
    }
}

#[given("the API server is running")]
async fn server_running(_w: &mut ApiWorld) {
    // Server is created in World::new — this step is a no-op placeholder
}

#[when(expr = "I request GET {string}")]
async fn get_request(w: &mut ApiWorld, path: String) {
    w.response = Some(w.server.get(&path).await);
}

#[then(expr = "the response status should be {int}")]
async fn check_status(w: &mut ApiWorld, status: u16) {
    let resp = w.response.as_ref().expect("no response captured");
    resp.assert_status(axum::http::StatusCode::from_u16(status).unwrap());
}
