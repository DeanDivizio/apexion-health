import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminUserId } from "@/lib/auth/admin";
import { BroadcastTemplate } from "@/emails/BroadcastTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "Apexion Health <noreply@apexion.health>";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAdminUserId();
    const { subject, body } = await req.json();

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: "Subject and body are required." },
        { status: 400 },
      );
    }

    const clerk = await clerkClient();
    const adminUser = await clerk.users.getUser(userId);
    const adminEmail = adminUser.emailAddresses.find(
      (e) => e.id === adminUser.primaryEmailAddressId,
    )?.emailAddress;

    if (!adminEmail) {
      return NextResponse.json(
        { error: "Could not determine admin email." },
        { status: 400 },
      );
    }

    const html = await render(
      BroadcastTemplate({ subject, body }),
    );

    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `[TEST] ${subject}`,
      html,
    });

    if (result.error) {
      console.error("Test email error:", result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, to: adminEmail });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email." },
      { status: 500 },
    );
  }
}
