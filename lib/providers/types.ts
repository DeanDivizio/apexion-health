import type { ProviderConnectionStatus } from "@prisma/client";

export type Provider = "whoop"; // extend as new providers are added

export interface ProviderTokenConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number; // seconds
}

export interface ProviderConnectionRow {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
  status: ProviderConnectionStatus;
  lastSyncAt: Date | null;
  syncCursor: unknown;
  errorMessage: string | null;
}

export const PROVIDER_CONFIGS: Record<Provider, { tokenUrl: string; authUrl: string }> = {
  whoop: {
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
  },
};
