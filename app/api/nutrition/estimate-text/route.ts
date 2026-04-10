import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { estimateMealFromText } from "@/lib/ocr/estimateMealFromText";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const description = body?.description;
  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json(
      { error: "A meal description is required." },
      { status: 400 },
    );
  }

  try {
    const result = await estimateMealFromText(description.trim());
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to estimate meal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
