import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { requireAdminUserId } from "@/lib/auth/admin";
import { BroadcastTemplate } from "@/emails/BroadcastTemplate";

export async function POST(req: NextRequest) {
  try {
    await requireAdminUserId();
    const { subject, body } = await req.json();

    const html = await render(
      BroadcastTemplate({
        subject: subject ?? "(No subject)",
        body: body ?? "",
      }),
    );

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Preview render failed:", error);
    return NextResponse.json(
      { error: "Failed to render preview." },
      { status: 500 },
    );
  }
}
