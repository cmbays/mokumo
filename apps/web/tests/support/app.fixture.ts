import { test as base, createBdd } from "playwright-bdd";
import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getPort } from "get-port-please";

const __dirname = dirname(fileURLToPath(import.meta.url));

type WorkerFixtures = {
  appUrl: string;
};

export const test = base.extend<object, WorkerFixtures>({
  appUrl: [
    // oxlint-disable-next-line eslint/no-empty-pattern -- playwright-bdd requires object destructuring
    async ({}, use) => {
      const webRoot = resolve(__dirname, "../..");
      const buildDir = resolve(webRoot, "build");
      if (!existsSync(buildDir)) {
        throw new Error(
          `SvelteKit build not found at ${buildDir}. Run 'moon run web:build' first.`,
        );
      }

      const port = await getPort({ portRange: [4200, 4299] });
      const url = `http://localhost:${port}`;

      const httpServerBin = resolve(webRoot, "node_modules/.bin/http-server");
      const server = spawn(
        httpServerBin,
        [buildDir, "-p", String(port), "-s", "--proxy", `http://localhost:${port}?`],
        {
          stdio: "ignore",
          cwd: webRoot,
        },
      );

      try {
        await waitForServer(url, server);
        await use(url);
      } finally {
        server.kill("SIGTERM");
      }
    },
    { auto: true, scope: "worker" },
  ],
});

export const { Given, When, Then } = createBdd(test);

async function waitForServer(
  url: string,
  process: ChildProcess,
  timeoutMs = 15_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // server not ready yet
    }

    if (process.exitCode !== null) {
      throw new Error(`http-server exited with code ${process.exitCode}`);
    }

    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`App server did not start within ${timeoutMs}ms`);
}
