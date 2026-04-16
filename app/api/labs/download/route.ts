import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { downloadLabReportFile } from "@/lib/labs/server/labReportStorage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reportId = request.nextUrl.searchParams.get("reportId");
  if (!reportId) {
    return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
  }

  const report = await prisma.labReport.findFirst({
    where: { id: reportId, userId },
    select: { originalFileName: true, originalFileMimeType: true },
  });

  if (!report?.originalFileName) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const bytes = await downloadLabReportFile(userId, reportId, report.originalFileName);

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": report.originalFileMimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${report.originalFileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
