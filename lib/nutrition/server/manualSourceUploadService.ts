import type { NutritionSourceType } from "@/lib/nutrition/ingestion/types";
import {
  getRetailChainSourceById,
  setRetailChainSourceManualArtifact,
} from "@/lib/nutrition/server/sourceRegistryService";
import { uploadRetailSourceFile } from "@/lib/nutrition/server/sourceStorageService";

export const MAX_MANUAL_SOURCE_SIZE_BYTES = 25 * 1024 * 1024;

function inferSourceTypeFromUploadedFile(
  fileName: string,
  mimeType: string,
): NutritionSourceType | undefined {
  const lowerName = fileName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();
  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  if (lowerMime.includes("csv") || lowerName.endsWith(".csv")) return "csv";
  if (
    lowerMime.includes("sheet") ||
    lowerMime.includes("excel") ||
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls")
  ) {
    return "xlsx";
  }
  return undefined;
}

export async function uploadManualSourceFileForSource(
  sourceId: string,
  file: File,
) {
  if (!sourceId) throw new Error("Source ID is required.");
  if (file.size === 0) throw new Error("Uploaded file is empty.");
  if (file.size > MAX_MANUAL_SOURCE_SIZE_BYTES) {
    throw new Error("File exceeds 25MB upload limit.");
  }

  const source = await getRetailChainSourceById(sourceId);
  if (!source) throw new Error("Source not found.");

  const fileName = file.name || "nutrition-source.pdf";
  const mimeType = file.type || "application/octet-stream";
  const fileBuffer = new Uint8Array(await file.arrayBuffer());

  const uploaded = await uploadRetailSourceFile({
    chainId: source.chainId,
    sourceId: source.id,
    fileName,
    mimeType,
    body: fileBuffer,
  });

  return setRetailChainSourceManualArtifact(source.id, {
    storagePath: uploaded.storagePath,
    fileName: uploaded.fileName,
    mimeType: uploaded.mimeType,
    fileSizeBytes: uploaded.fileSizeBytes,
    checksumSha256: uploaded.checksumSha256,
    sourceType: inferSourceTypeFromUploadedFile(fileName, mimeType),
  });
}
