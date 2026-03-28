import { createHash } from "node:crypto";
import { basename } from "node:path";
import { prisma } from "@/lib/db/prisma";
import type { IngestionArtifactInput } from "@/lib/nutrition/ingestion/schemas";
import type {
  IngestionArtifactDescriptor,
  NutritionSourceType,
  RetailChainSourceConfig,
} from "@/lib/nutrition/ingestion/types";
import { assertRetailIngestionModels } from "@/lib/nutrition/server/sourceRegistryService";

const db = prisma as any;

export type SourceFetchStatus = "fetched" | "needs_source" | "fetch_failed";

export interface FetchedRetailSourceArtifact extends IngestionArtifactDescriptor {
  status: SourceFetchStatus;
  body: Uint8Array | null;
  errorMessage: string | null;
}

function sha256Hex(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function parseFileNameFromContentDisposition(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?(.*?)"?($|;)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return null;
}

function inferSourceTypeFromResponse(
  configuredSourceType: NutritionSourceType,
  sourceUrl: string | null,
  mimeType: string | null,
): NutritionSourceType {
  // Manual source type is authoritative.
  if (configuredSourceType !== "html_link") return configuredSourceType;

  const lowerMime = (mimeType ?? "").toLowerCase();
  if (lowerMime.includes("csv")) return "csv";
  if (lowerMime.includes("sheet") || lowerMime.includes("excel")) return "xlsx";
  if (lowerMime.includes("pdf")) return "pdf";

  const lowerUrl = (sourceUrl ?? "").toLowerCase();
  if (lowerUrl.endsWith(".csv")) return "csv";
  if (lowerUrl.endsWith(".xlsx") || lowerUrl.endsWith(".xls")) return "xlsx";
  if (lowerUrl.endsWith(".pdf")) return "pdf";

  return configuredSourceType;
}

export async function fetchRetailSourceArtifact(
  source: RetailChainSourceConfig,
): Promise<FetchedRetailSourceArtifact> {
  if (source.fetchMethod === "manual_upload_only") {
    return {
      status: "needs_source",
      body: null,
      errorMessage: "Source is marked manual_upload_only.",
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      fileName: null,
      mimeType: null,
      storagePath: null,
      fileSizeBytes: null,
      checksumSha256: null,
      httpStatus: null,
    };
  }

  if (!source.sourceUrl) {
    return {
      status: "needs_source",
      body: null,
      errorMessage: "No source URL configured.",
      sourceUrl: null,
      sourceType: source.sourceType,
      fileName: null,
      mimeType: null,
      storagePath: null,
      fileSizeBytes: null,
      checksumSha256: null,
      httpStatus: null,
    };
  }

  let response: Response;
  try {
    response = await fetch(source.sourceUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
  } catch (error) {
    return {
      status: "fetch_failed",
      body: null,
      errorMessage: error instanceof Error ? error.message : "Failed to fetch source URL.",
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      fileName: null,
      mimeType: null,
      storagePath: null,
      fileSizeBytes: null,
      checksumSha256: null,
      httpStatus: null,
    };
  }

  const mimeType = response.headers.get("content-type");
  const contentDisposition = response.headers.get("content-disposition");

  let fileName = parseFileNameFromContentDisposition(contentDisposition);
  if (!fileName) {
    try {
      const parsedUrl = new URL(source.sourceUrl);
      fileName = basename(parsedUrl.pathname) || null;
    } catch {
      fileName = null;
    }
  }

  if (!response.ok) {
    return {
      status: "fetch_failed",
      body: null,
      errorMessage: `Source fetch failed with HTTP ${response.status}.`,
      sourceUrl: source.sourceUrl,
      sourceType: inferSourceTypeFromResponse(
        source.sourceType,
        source.sourceUrl,
        mimeType,
      ),
      fileName,
      mimeType,
      storagePath: null,
      fileSizeBytes: null,
      checksumSha256: null,
      httpStatus: response.status,
    };
  }

  const bodyBuffer = new Uint8Array(await response.arrayBuffer());
  return {
    status: "fetched",
    body: bodyBuffer,
    errorMessage: null,
    sourceUrl: source.sourceUrl,
    sourceType: inferSourceTypeFromResponse(
      source.sourceType,
      source.sourceUrl,
      mimeType,
    ),
    fileName,
    mimeType,
    storagePath: null,
    fileSizeBytes: bodyBuffer.byteLength,
    checksumSha256: sha256Hex(bodyBuffer),
    httpStatus: response.status,
  };
}

export async function createIngestionArtifactRecord(
  runId: string,
  input: IngestionArtifactInput,
): Promise<string> {
  assertRetailIngestionModels();

  const created = await db.nutritionRetailIngestionArtifact.create({
    data: {
      runId,
      sourceUrl: input.sourceUrl,
      sourceType: input.sourceType,
      fileName: input.fileName,
      mimeType: input.mimeType,
      storagePath: input.storagePath,
      fileSizeBytes: input.fileSizeBytes,
      checksumSha256: input.checksumSha256,
      httpStatus: input.httpStatus,
    },
    select: { id: true },
  });

  return created.id;
}

export function toArtifactInput(
  artifact: FetchedRetailSourceArtifact,
): IngestionArtifactInput {
  return {
    sourceUrl: artifact.sourceUrl,
    sourceType: artifact.sourceType,
    fileName: artifact.fileName,
    mimeType: artifact.mimeType,
    storagePath: artifact.storagePath,
    fileSizeBytes: artifact.fileSizeBytes,
    checksumSha256: artifact.checksumSha256,
    httpStatus: artifact.httpStatus,
  };
}
