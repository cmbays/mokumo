import { redirect, error } from "@sveltejs/kit";
import type { MeResponse } from "$lib/types/MeResponse";
import type { SetupStatusResponse } from "$lib/types/SetupStatusResponse";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch }) => {
  const statusRes = await fetch("/api/setup-status");
  if (!statusRes.ok) {
    throw error(503, "Could not reach the server. Please refresh.");
  }

  const status = (await statusRes.json()) as SetupStatusResponse;

  if (status.is_first_launch) {
    throw redirect(307, "/welcome");
  }
  if (!status.setup_complete) {
    throw redirect(307, "/setup");
  }

  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    throw redirect(307, "/login");
  }

  const data = (await res.json()) as MeResponse;
  return {
    user: data.user,
    recovery_codes_remaining: data.recovery_codes_remaining,
    setup_mode: status.setup_mode,
    production_setup_complete: status.production_setup_complete,
    shop_name: status.shop_name,
  };
};
