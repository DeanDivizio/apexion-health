import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_BUCKET = "lab-reports";

function getBucketName(): string {
  return process.env.SUPABASE_LAB_REPORTS_BUCKET || DEFAULT_BUCKET;
}

export async function uploadLabReportFile(params: {
  userId: string;
  reportId: string;
  fileName: string;
  mimeType: string;
  body: Uint8Array;
}): Promise<string> {
  const bucket = getBucketName();
  const supabase = createSupabaseServerClient();
  const path = `${params.userId}/${params.reportId}/${params.fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, params.body, {
    cacheControl: "3600",
    contentType: params.mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  return path;
}

export async function downloadLabReportFile(
  userId: string,
  reportId: string,
  fileName: string,
): Promise<Uint8Array> {
  const bucket = getBucketName();
  const supabase = createSupabaseServerClient();
  const path = `${userId}/${reportId}/${fileName}`;

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw new Error(error?.message || "Could not download lab report file.");
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function deleteLabReportFile(
  userId: string,
  reportId: string,
  fileName: string,
): Promise<void> {
  const bucket = getBucketName();
  const supabase = createSupabaseServerClient();
  const path = `${userId}/${reportId}/${fileName}`;

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}
