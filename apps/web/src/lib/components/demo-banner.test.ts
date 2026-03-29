// @vitest-environment jsdom

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import DemoBanner from "./demo-banner.svelte";

// Override setup default: demo-banner is browser-only, jsdom IS browser-like
vi.mock("$app/environment", () => ({ browser: true, dev: false, building: false }));

describe("DemoBanner", () => {
  it('shows banner when setupMode is "demo"', () => {
    render(DemoBanner, { setupMode: "demo" });
    expect(screen.getByTestId("demo-banner")).toBeInTheDocument();
  });

  it('hides banner when setupMode is not "demo"', () => {
    render(DemoBanner, { setupMode: null });
    expect(screen.queryByTestId("demo-banner")).not.toBeInTheDocument();
  });

  it("persists dismiss to localStorage and hides banner", async () => {
    render(DemoBanner, { setupMode: "demo" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(localStorage.getItem("demo_banner_dismissed")).toBe("true");
    expect(screen.queryByTestId("demo-banner")).not.toBeInTheDocument();
  });

  it("hides banner on mount when already dismissed", () => {
    localStorage.setItem("demo_banner_dismissed", "true"); // set before render
    render(DemoBanner, { setupMode: "demo" });
    expect(screen.queryByTestId("demo-banner")).not.toBeInTheDocument();
  });
});
