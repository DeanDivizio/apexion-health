import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { exchangeCodeForTokens } from "@/lib/providers/token-service";
import { getUserProfile } from "@/lib/providers/whoop/api-client";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Whoop OAuth error:", error);
    return NextResponse.redirect(
      new URL("/connect/whoop?error=denied", request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/connect/whoop?error=no_code", request.url),
    );
  }

  // Validate CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("whoop_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL("/connect/whoop?error=invalid_state", request.url),
    );
  }

  const storedScopes = cookieStore.get("whoop_oauth_scopes")?.value ?? "";

  try {
    const redirectUri = process.env.WHOOP_REDIRECT_URI ?? "";
    const tokenPair = await exchangeCodeForTokens("whoop", code, redirectUri);

    // Fetch the Whoop user profile to store their provider-side ID
    const profile = await getUserProfile(tokenPair.accessToken);

    // Upsert the connection — handles both first connect and reconnect
    await prisma.providerConnection.upsert({
      where: { userId_provider: { userId, provider: "whoop" } },
      create: {
        userId,
        provider: "whoop",
        providerUserId: String(profile.user_id),
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenPair.expiresIn * 1000),
        scopes: storedScopes.split(",").filter(Boolean),
        status: "ACTIVE",
      },
      update: {
        providerUserId: String(profile.user_id),
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenPair.expiresIn * 1000),
        scopes: storedScopes.split(",").filter(Boolean),
        status: "ACTIVE",
        errorMessage: null,
      },
    });

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      new URL("/biometrics?connected=true", request.url),
    );
    response.cookies.delete("whoop_oauth_state");
    response.cookies.delete("whoop_oauth_scopes");
    return response;
  } catch (err) {
    console.error("Whoop OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/connect/whoop?error=exchange_failed", request.url),
    );
  }
}
