import { fetchPlatform } from "$lib/platform";

export interface OverviewChecklistStep {
  id: string;
  label: string;
  complete: boolean;
}

export interface OverviewStat {
  label: string;
  value: string;
}

export interface OverviewActivity {
  id: string;
  label: string;
  href: string;
}

export interface OverviewBackups {
  last_at: string | null;
  next_at: string | null;
}

export interface OverviewSystemHealth {
  status: "ok" | "degraded" | "down";
}

export interface OverviewData {
  fresh_install: boolean;
  get_started_steps: OverviewChecklistStep[];
  stat_strip?: OverviewStat[];
  recent_activity?: OverviewActivity[];
  backups?: OverviewBackups;
  system_health?: OverviewSystemHealth;
}

export const load = async (): Promise<{
  overview: OverviewData | undefined;
}> => {
  try {
    const overview = await fetchPlatform<OverviewData>("/overview");
    return { overview };
  } catch {
    return { overview: undefined };
  }
};
