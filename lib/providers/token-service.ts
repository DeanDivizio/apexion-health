import { prisma } from "@/lib/db/prisma";
import { PROVIDER_CONFIGS, type Provider, type TokenPair } from "./types";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

function getProviderCredentials(provider: Provider) {
  const config = PROVIDER_CONFIGS[provider];
  let clientId: string;
  let clientSecret: string;

  switch (provider) {
    case "whoop":
      clientId = process.env.WHOOP_CLIENT_ID ?? "";
      clientSecret = process.env.WHOOP_CLIENT_SECRET ?? "";
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  if (!clientId || !clientSecret) {
    throw new Error(`Missing credentials for provider: ${provider}`);
  }

  return { ...config, clientId, clientSecret };
}

function tokenIsValid(expiresAt: Date | null): boolean {
  return !!expiresAt && expiresAt.getTime() - Date.now() >= TOKEN_REFRESH_BUFFER_MS;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  provider: Provider,
  code: string,
  redirectUri: string,
): Promise<TokenPair> {
  const { tokenUrl, clientId, clientSecret } = getProviderCredentials(provider);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh an expired access token using the stored refresh token.
 *
 * Uses optimistic concurrency to handle the case where multiple serverless
 * instances attempt to refresh the same token simultaneously. Whoop (Hydra)
 * rotates refresh tokens on each use, so the first instance to succeed
 * invalidates the old token. If a concurrent instance loses the race, we
 * re-read the DB and return the token the winner already persisted.
 */
export async function refreshAccessToken(connectionId: string): Promise<TokenPair> {
  const connection = await prisma.providerConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  // Another instance may have already refreshed between our caller's check
  // and this point. Re-validate before hitting the provider.
  if (tokenIsValid(connection.tokenExpiresAt)) {
    return {
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken!,
      expiresIn: Math.floor(
        (connection.tokenExpiresAt!.getTime() - Date.now()) / 1000,
      ),
    };
  }

  if (!connection.refreshToken) {
    await markConnectionError(connectionId, "No refresh token available");
    throw new Error("No refresh token available for connection");
  }

  const oldRefreshToken = connection.refreshToken;
  const provider = connection.provider as Provider;
  const { tokenUrl, clientId, clientSecret } = getProviderCredentials(provider);

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: oldRefreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: "offline",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();

    // Before marking as error, check if a concurrent instance already
    // refreshed successfully (its update would show a fresh tokenExpiresAt).
    const current = await prisma.providerConnection.findUniqueOrThrow({
      where: { id: connectionId },
    });
    if (tokenIsValid(current.tokenExpiresAt)) {
      return {
        accessToken: current.accessToken,
        refreshToken: current.refreshToken!,
        expiresIn: Math.floor(
          (current.tokenExpiresAt!.getTime() - Date.now()) / 1000,
        ),
      };
    }

    if (res.status === 401 || res.status === 400) {
      await markConnectionError(connectionId, `Refresh failed: ${text}`);
    }
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const tokenPair: TokenPair = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? oldRefreshToken,
    expiresIn: data.expires_in,
  };

  // Optimistic update: only write if the refresh token in the DB is still the
  // one we used. If another instance already rotated it, their tokens win and
  // we avoid overwriting with potentially stale data.
  const updated = await prisma.providerConnection.updateMany({
    where: { id: connectionId, refreshToken: oldRefreshToken },
    data: {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokenPair.expiresIn * 1000),
      status: "ACTIVE",
      errorMessage: null,
    },
  });

  if (updated.count === 0) {
    // Lost the race — another instance already updated. Read their result.
    const current = await prisma.providerConnection.findUniqueOrThrow({
      where: { id: connectionId },
    });
    return {
      accessToken: current.accessToken,
      refreshToken: current.refreshToken!,
      expiresIn: Math.floor(
        ((current.tokenExpiresAt?.getTime() ?? Date.now()) - Date.now()) / 1000,
      ),
    };
  }

  return tokenPair;
}

/**
 * Returns a valid access token for the connection, refreshing proactively
 * if the token is expired or about to expire.
 */
export async function getValidToken(connectionId: string): Promise<string> {
  const connection = await prisma.providerConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  if (connection.status === "REVOKED") {
    throw new Error("Connection has been revoked");
  }

  if (tokenIsValid(connection.tokenExpiresAt)) {
    return connection.accessToken;
  }

  // Token needs refresh. If the connection is in ERROR state from a previous
  // failed refresh, we still attempt it — a concurrent instance may have
  // rotated the token since the error was recorded, or the issue may have
  // been transient.
  const refreshed = await refreshAccessToken(connectionId);
  return refreshed.accessToken;
}

/**
 * Convenience: get a valid token by userId + provider instead of connectionId.
 */
export async function getValidTokenForUser(
  userId: string,
  provider: Provider,
): Promise<{ token: string; connectionId: string }> {
  const connection = await prisma.providerConnection.findUnique({
    where: { userId_provider: { userId, provider } },
  });

  if (!connection) {
    throw new Error(`No ${provider} connection for user ${userId}`);
  }

  const token = await getValidToken(connection.id);
  return { token, connectionId: connection.id };
}

/**
 * Revoke the access token with the provider and mark the connection as REVOKED.
 */
export async function revokeConnection(connectionId: string): Promise<void> {
  const connection = await prisma.providerConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  const provider = connection.provider as Provider;

  if (provider === "whoop") {
    try {
      await fetch("https://api.prod.whoop.com/developer/v2/user/access", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${connection.accessToken}` },
      });
    } catch {
      // Best effort — token may already be invalid
    }
  }

  await prisma.providerConnection.update({
    where: { id: connectionId },
    data: { status: "REVOKED", errorMessage: null },
  });
}

/**
 * Mark a connection as errored, but only if no concurrent instance has
 * already refreshed it successfully (indicated by a valid tokenExpiresAt).
 */
export async function markConnectionError(
  connectionId: string,
  message: string,
): Promise<void> {
  await prisma.providerConnection.updateMany({
    where: {
      id: connectionId,
      status: { not: "REVOKED" },
      OR: [
        { tokenExpiresAt: null },
        { tokenExpiresAt: { lt: new Date(Date.now() + TOKEN_REFRESH_BUFFER_MS) } },
      ],
    },
    data: { status: "ERROR", errorMessage: message },
  });
}
