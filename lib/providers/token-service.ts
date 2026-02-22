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
 * Updates the DB row and returns the new token pair.
 */
export async function refreshAccessToken(connectionId: string): Promise<TokenPair> {
  const connection = await prisma.providerConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  if (!connection.refreshToken) {
    await markConnectionError(connectionId, "No refresh token available");
    throw new Error("No refresh token available for connection");
  }

  const provider = connection.provider as Provider;
  const { tokenUrl, clientId, clientSecret } = getProviderCredentials(provider);

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
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
    if (res.status === 401 || res.status === 400) {
      await markConnectionError(connectionId, `Refresh failed: ${text}`);
    }
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const tokenPair: TokenPair = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? connection.refreshToken,
    expiresIn: data.expires_in,
  };

  await prisma.providerConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokenPair.expiresIn * 1000),
      status: "ACTIVE",
      errorMessage: null,
    },
  });

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

  const needsRefresh =
    !connection.tokenExpiresAt ||
    connection.tokenExpiresAt.getTime() - Date.now() < TOKEN_REFRESH_BUFFER_MS;

  if (needsRefresh) {
    const refreshed = await refreshAccessToken(connectionId);
    return refreshed.accessToken;
  }

  return connection.accessToken;
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

  // Provider-specific revocation
  if (provider === "whoop") {
    try {
      await fetch("https://api.prod.whoop.com/v2/user/access", {
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

export async function markConnectionError(
  connectionId: string,
  message: string,
): Promise<void> {
  await prisma.providerConnection.update({
    where: { id: connectionId },
    data: { status: "ERROR", errorMessage: message },
  });
}
