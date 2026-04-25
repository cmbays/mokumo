/**
 * Single removal-site for platform-API calls (CQO-A6).
 *
 * Always targets the absolute `/api/platform/v1/...` origin — never prepends
 * `$app/paths.base`. Mocks intercept on `**\/api/platform/v1/**`; including
 * the `/admin` prefix would bypass them and produce real 404s.
 */

export class PlatformError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PlatformError";
  }
}

export interface FetchOptions {
  signal?: AbortSignal;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

const PLATFORM_PREFIX = "/api/platform/v1";

export async function fetchPlatform<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${PLATFORM_PREFIX}${path}`;
  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers: { Accept: "application/json" },
    signal: opts.signal,
  };
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw err;
    }
    throw new PlatformError(0, "network_error", `Network error reaching ${url}`);
  }

  if (!response.ok) {
    let code = "server_error";
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { code?: string; message?: string };
      if (body.code) code = body.code;
      if (body.message) message = body.message;
    } catch {
      // body wasn't JSON; keep the defaults.
    }
    throw new PlatformError(response.status, code, message);
  }

  return (await response.json()) as T;
}

/** Tiny health probe used by the SelfHealingBanner / ConnectionMonitor. */
export async function pingPlatform(signal?: AbortSignal): Promise<boolean> {
  try {
    const r = await fetch(`${PLATFORM_PREFIX}/branding`, { signal });
    return r.ok;
  } catch {
    return false;
  }
}
