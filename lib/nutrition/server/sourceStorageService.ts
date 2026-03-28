import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_BUCKET = "nutrition-sources";

function getBucketName(): string {
  return process.env.SUPABASE_NUTRITION_BUCKET || DEFAULT_BUCKET;
}

function sanitizePathSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toIsoDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function sha256Hex(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export interface UploadedSourceFileDescriptor {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
}

export async function uploadRetailSourceFile(params: {
  chainId: string;
  sourceId: string;
  fileName: string;
  mimeType: string;
  body: Uint8Array;
}): Promise<UploadedSourceFileDescriptor> {
  const bucket = getBucketName();
  const supabase = createSupabaseServerClient();
  const safeFileName = sanitizePathSegment(params.fileName) || "nutrition-source.pdf";
  const path = `nutrition/${sanitizePathSegment(params.chainId)}/${sanitizePathSegment(
    params.sourceId,
  )}/${toIsoDateString()}-${safeFileName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, params.body, {
    cacheControl: "3600",
    contentType: params.mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  return {
    storagePath: path,
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSizeBytes: params.body.byteLength,
    checksumSha256: sha256Hex(params.body),
  };
}

export async function downloadRetailSourceFile(params: {
  storagePath: string;
}): Promise<{
  body: Uint8Array;
  mimeType: string | null;
  fileSizeBytes: number;
  checksumSha256: string;
}> {
  const bucket = getBucketName();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(params.storagePath);

  if (error || !data) {
    throw new Error(error?.message || "Could not download manual source file.");
  }

  const body = new Uint8Array(await data.arrayBuffer());
  return {
    body,
    mimeType: data.type || null,
    fileSizeBytes: body.byteLength,
    checksumSha256: sha256Hex(body),
  };
}
