import type { ErrorBody } from "./types/ErrorBody";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ErrorBody };

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, options);

    if (response.ok) {
      const data: T = await response.json();
      return { ok: true, data };
    }

    const error: ErrorBody = await response.json();
    return { ok: false, status: response.status, error };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: {
        code: "network_error",
        message: err instanceof Error ? err.message : "Network request failed",
        details: null,
      },
    };
  }
}
