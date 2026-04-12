import { NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/auth/admin";

/**
 * Returns a NextResponse error if the user is not an admin, or null if authorized.
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  try {
    await requireAdminUserId();
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message.includes("Admin") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
