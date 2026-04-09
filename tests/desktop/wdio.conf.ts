import type { Options } from "@wdio/types";
import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

// tauri-driver manages WebKitWebDriver (Linux) or EdgeDriver (Windows).
// It listens on port 4444 by default.
const TAURI_DRIVER_PORT = 4444;

let tauriDriver: ChildProcess;

export const config: Options.Testrunner = {
  runner: "local",

  specs: ["./specs/**/*.spec.ts"],
  maxInstances: 1, // Desktop app — one instance at a time

  capabilities: [
    {
      "browserName": "wry", // Tauri's webview engine
      "tauri:options": {
        application: resolve(
          import.meta.dirname,
          "../../target/debug/mokumo-desktop"
        ),
      },
    } as WebdriverIO.Capabilities,
  ],

  hostname: "localhost",
  port: TAURI_DRIVER_PORT,

  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 60_000, // Desktop startup can be slow in CI
  },

  reporters: ["spec"],

  // Start tauri-driver before tests, stop after
  onPrepare() {
    tauriDriver = spawn("tauri-driver", ["--port", String(TAURI_DRIVER_PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    tauriDriver.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[tauri-driver] ${msg}`);
    });

    // Give tauri-driver time to bind the port
    return new Promise<void>((resolve) => setTimeout(resolve, 2000));
  },

  onComplete() {
    tauriDriver?.kill();
  },
};
