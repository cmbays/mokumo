import { fetchPlatform } from "./platform";

export interface PlatformBranding {
  app_name: string;
  shop_noun_singular: string;
  shop_noun_plural: string;
  logo_url: string | null;
  accent_color: string;
}

export interface BrandingTokens {
  bg: string;
  fg: string;
  primary: string;
  primaryFg: string;
  muted: string;
  mutedFg: string;
  border: string;
  accent: string;
  accentFg: string;
}

export interface BrandingConfig {
  appName: string;
  shopNounSingular: string;
  shopNounPlural: string;
  logoUrl: string | null;
  tokens: BrandingTokens;
}

const DEFAULT_TOKENS: BrandingTokens = {
  bg: "hsl(0 0% 100%)",
  fg: "hsl(222 47% 11%)",
  primary: "hsl(222 47% 11%)",
  primaryFg: "hsl(210 40% 98%)",
  muted: "hsl(210 40% 96%)",
  mutedFg: "hsl(215 16% 47%)",
  border: "hsl(214 32% 91%)",
  accent: "#6366f1",
  accentFg: "hsl(210 40% 98%)",
};

export const FALLBACK_BRANDING: BrandingConfig = {
  appName: "Mokumo",
  shopNounSingular: "shop",
  shopNounPlural: "shops",
  logoUrl: null,
  tokens: DEFAULT_TOKENS,
};

function resolveTokens(accentColor: string): BrandingTokens {
  return { ...DEFAULT_TOKENS, accent: accentColor || DEFAULT_TOKENS.accent };
}

function fromPlatform(b: PlatformBranding): BrandingConfig {
  return {
    appName: b.app_name,
    shopNounSingular: b.shop_noun_singular,
    shopNounPlural: b.shop_noun_plural,
    logoUrl: b.logo_url,
    tokens: resolveTokens(b.accent_color),
  };
}

export async function loadBranding(signal?: AbortSignal): Promise<BrandingConfig> {
  try {
    const dto = await fetchPlatform<PlatformBranding>("/branding", { signal });
    return fromPlatform(dto);
  } catch {
    return FALLBACK_BRANDING;
  }
}

/** Mirrors the resolved tokens onto :root so all surfaces inherit them. */
export function applyTokensToRoot(tokens: BrandingTokens): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-bg", tokens.bg);
  root.style.setProperty("--brand-fg", tokens.fg);
  root.style.setProperty("--brand-primary", tokens.primary);
  root.style.setProperty("--brand-primary-fg", tokens.primaryFg);
  root.style.setProperty("--brand-muted", tokens.muted);
  root.style.setProperty("--brand-muted-fg", tokens.mutedFg);
  root.style.setProperty("--brand-border", tokens.border);
  root.style.setProperty("--brand-accent", tokens.accent);
  root.style.setProperty("--brand-accent-fg", tokens.accentFg);
}
