// Bake INSTA_WORKSPACE_ROOT into the test binary so insta resolves snapshot
// paths without invoking `cargo metadata` at runtime — required for
// cargo-mutants whose reflinked tmp tree breaks `cargo metadata`.

fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR unset");
    let workspace_root = std::path::Path::new(&manifest_dir)
        .parent()
        .and_then(|p| p.parent())
        .expect("two-level parent of CARGO_MANIFEST_DIR not found");

    assert!(
        workspace_root.join("Cargo.toml").exists(),
        "computed workspace root {} missing Cargo.toml — \
         crate must be at <workspace>/crates/<name>/",
        workspace_root.display(),
    );

    println!(
        "cargo:rustc-env=INSTA_WORKSPACE_ROOT={}",
        workspace_root.display()
    );
    println!("cargo:rerun-if-changed=build.rs");
}
