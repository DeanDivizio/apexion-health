import { NextRequest, NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/auth/admin";
import { uploadManualSourceFileForSource } from "@/lib/nutrition/server/manualSourceUploadService";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    await requireAdminUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart payload" }, { status: 400 });
  }

  const sourceId = formData.get("sourceId");
  const fileValue = formData.get("file");
  if (typeof sourceId !== "string" || !sourceId) {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  try {
    const source = await uploadManualSourceFileForSource(sourceId, fileValue);
    return NextResponse.json({
      sourceId: source.id,
      sourceName: source.sourceName,
      manualFileName: source.manualFileName,
      manualUploadedAt: source.manualUploadedAt,
      fetchMethod: source.fetchMethod,
      sourceType: source.sourceType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
