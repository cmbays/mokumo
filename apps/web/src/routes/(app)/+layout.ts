import { redirect } from "@sveltejs/kit";
import type { MeResponse } from "$lib/types/MeResponse";
import type { SetupStatusResponse } from "$lib/types/SetupStatusResponse";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch }) => {
  const statusRes = await fetch("/api/setup-status");
  let setupMode: SetupStatusResponse["setup_mode"] = null;
  let productionSetupComplete = false;
  let shopName: string | null = null;

  if (statusRes.ok) {
    const status = (await statusRes.json()) as SetupStatusResponse;
    setupMode = status.setup_mode;
    productionSetupComplete = status.production_setup_complete;
    shopName = status.shop_name;

    if (status.is_first_launch) {
      throw redirect(307, "/welcome");
    }
    if (!status.setup_complete) {
      throw redirect(307, "/setup");
    }
  }

  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    throw redirect(307, "/login");
  }

  const data = (await res.json()) as MeResponse;
  return {
    user: data.user,
    recovery_codes_remaining: data.recovery_codes_remaining,
    setup_mode: setupMode,
    production_setup_complete: productionSetupComplete,
    shop_name: shopName,
  };
};
