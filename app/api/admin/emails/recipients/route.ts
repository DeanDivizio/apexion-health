import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminUserId } from "@/lib/auth/admin";

export async function GET() {
  try {
    await requireAdminUserId();

    const clerk = await clerkClient();
    let count = 0;
    let offset = 0;
    const limit = 500;

    while (true) {
      const page = await clerk.users.getUserList({ limit, offset });
      for (const user of page.data) {
        const hasEmail = user.emailAddresses.some(
          (e) => e.id === user.primaryEmailAddressId,
        );
        if (hasEmail) count++;
      }
      if (page.data.length < limit) break;
      offset += limit;
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to count recipients:", error);
    return NextResponse.json(
      { error: "Failed to count recipients." },
      { status: 500 },
    );
  }
}
