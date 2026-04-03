import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminUserId } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { BroadcastTemplate } from "@/emails/BroadcastTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ??
  "Dean from Apexion Health <noreply@apexion.health>";
const BATCH_SIZE = 50;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUserId();

    const { id } = await params;
    const broadcast = await prisma.emailBroadcast.findUnique({ where: { id } });
    if (!broadcast) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }
    if (broadcast.sentAt) {
      return NextResponse.json(
        { error: "This email has already been sent." },
        { status: 400 },
      );
    }

    const html = await render(
      BroadcastTemplate({ subject: broadcast.subject, body: broadcast.body }),
    );

    const clerk = await clerkClient();
    const recipients: string[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const page = await clerk.users.getUserList({ limit, offset });
      for (const user of page.data) {
        const primaryEmail = user.emailAddresses.find(
          (e) => e.id === user.primaryEmailAddressId,
        )?.emailAddress;
        if (primaryEmail) {
          recipients.push(primaryEmail);
        }
      }
      if (page.data.length < limit) break;
      offset += limit;
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found." },
        { status: 400 },
      );
    }

    let sentCount = 0;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const batchPayload = batch.map((to) => ({
        from: FROM_ADDRESS,
        to,
        subject: broadcast.subject,
        html,
      }));

      const result = await resend.batch.send(batchPayload);
      if (result.error) {
        console.error("Resend batch error:", result.error);
      } else {
        sentCount += batch.length;
      }
    }

    await prisma.emailBroadcast.update({
      where: { id },
      data: { sentAt: new Date(), sentCount },
    });

    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error("Failed to send broadcast:", error);
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 500 },
    );
  }
}
