import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockError } = vi.hoisted(() => ({ mockError: vi.fn() }));
vi.mock("$lib/components/toast", () => ({ toast: { error: mockError } }));

import { toastApiError } from "./error-toast";
import type { ErrorBody } from "$lib/types/ErrorBody";

describe("toastApiError", () => {
  beforeEach(() => mockError.mockClear());

  it("uses fallback when error is null (network failure, no structured response)", () => {
    toastApiError(null, "Something went wrong.");
    expect(mockError).toHaveBeenCalledWith("Something went wrong.");
  });

  it("uses fallback when error is undefined", () => {
    toastApiError(undefined, "Something went wrong.");
    expect(mockError).toHaveBeenCalledWith("Something went wrong.");
  });

  it("surfaces server message for an allow-listed code (rate_limited)", () => {
    const error: ErrorBody = {
      code: "rate_limited",
      message: "Too many requests. Try again in 60 seconds.",
      details: null,
    };
    toastApiError(error, "Fallback message");
    expect(mockError).toHaveBeenCalledWith("Too many requests. Try again in 60 seconds.");
  });

  it("uses fallback for a security-sensitive code (internal_error)", () => {
    const error: ErrorBody = {
      code: "internal_error",
      message: "panic at src/handlers/profile.rs:42 — index out of bounds",
      details: null,
    };
    toastApiError(error, "Something went wrong. Please try again.");
    expect(mockError).toHaveBeenCalledWith("Something went wrong. Please try again.");
  });

  it("uses fallback for unauthorized (avoids leaking auth details)", () => {
    const error: ErrorBody = {
      code: "unauthorized",
      message: "JWT expired at 2026-04-14T00:00:00Z",
      details: null,
    };
    toastApiError(error, "Session expired. Please log in again.");
    expect(mockError).toHaveBeenCalledWith("Session expired. Please log in again.");
  });
});
