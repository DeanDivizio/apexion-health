import { prisma } from "@/lib/db/prisma";
import type {
  CreateRetailChainSourceInput,
  UpdateRetailChainSourceInput,
} from "@/lib/nutrition/ingestion/schemas";
import type { RetailChainSourceConfig } from "@/lib/nutrition/ingestion/types";

const db = prisma as any;

function hasRetailIngestionModels() {
  return (
    typeof db?.nutritionRetailChainSource?.findMany === "function" &&
    typeof db?.nutritionRetailIngestionRun?.findMany === "function" &&
    typeof db?.nutritionRetailIngestionArtifact?.findMany === "function" &&
    typeof db?.nutritionRetailStagingItem?.findMany === "function" &&
    typeof db?.nutritionRetailStagingIssue?.findMany === "function" &&
    typeof db?.nutritionRetailItemVersion?.findMany === "function"
  );
}

export function assertRetailIngestionModels() {
  if (!hasRetailIngestionModels()) {
    throw new Error(
      "Retail ingestion models are unavailable. Run migrations and regenerate Prisma client.",
    );
  }
}

function toSourceConfig(row: any): RetailChainSourceConfig {
  return {
    id: row.id,
    chainId: row.chainId,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl ?? null,
    manualStoragePath: row.manualStoragePath ?? null,
    manualFileName: row.manualFileName ?? null,
    manualMimeType: row.manualMimeType ?? null,
    manualFileSizeBytes: row.manualFileSizeBytes ?? null,
    manualChecksumSha256: row.manualChecksumSha256 ?? null,
    manualUploadedAt: row.manualUploadedAt ? row.manualUploadedAt.toISOString() : null,
    sourceType: row.sourceType,
    fetchMethod: row.fetchMethod,
    parserPreference: row.parserPreference,
    active: Boolean(row.active),
    priority: row.priority ?? 0,
    lastVerifiedAt: row.lastVerifiedAt ? row.lastVerifiedAt.toISOString() : null,
    notes: row.notes ?? null,
  };
}

export async function listRetailChainSources(
  chainId: string,
  includeInactive = false,
): Promise<RetailChainSourceConfig[]> {
  assertRetailIngestionModels();

  const rows = await db.nutritionRetailChainSource.findMany({
    where: includeInactive ? { chainId } : { chainId, active: true },
    orderBy: [{ priority: "desc" }, { sourceName: "asc" }],
  });

  return rows.map(toSourceConfig);
}

export async function getRetailChainSourceById(
  sourceId: string,
): Promise<RetailChainSourceConfig | null> {
  assertRetailIngestionModels();

  const row = await db.nutritionRetailChainSource.findUnique({
    where: { id: sourceId },
  });

  return row ? toSourceConfig(row) : null;
}

export async function createRetailChainSource(
  input: CreateRetailChainSourceInput,
): Promise<RetailChainSourceConfig> {
  assertRetailIngestionModels();

  const created = await db.nutritionRetailChainSource.create({
    data: {
      chainId: input.chainId,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      manualStoragePath: null,
      manualFileName: null,
      manualMimeType: null,
      manualFileSizeBytes: null,
      manualChecksumSha256: null,
      manualUploadedAt: null,
      sourceType: input.sourceType,
      fetchMethod: input.fetchMethod,
      parserPreference: input.parserPreference,
      active: input.active,
      priority: input.priority,
      notes: input.notes,
    },
  });

  return toSourceConfig(created);
}

export async function updateRetailChainSource(
  sourceId: string,
  input: UpdateRetailChainSourceInput,
): Promise<RetailChainSourceConfig> {
  assertRetailIngestionModels();

  const updated = await db.nutritionRetailChainSource.update({
    where: { id: sourceId },
    data: {
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      sourceType: input.sourceType,
      fetchMethod: input.fetchMethod,
      parserPreference: input.parserPreference,
      active: input.active,
      priority: input.priority,
      notes: input.notes,
      ...(input.lastVerifiedAtIso !== undefined
        ? {
            lastVerifiedAt: input.lastVerifiedAtIso
              ? new Date(input.lastVerifiedAtIso)
              : null,
          }
        : {}),
    },
  });

  return toSourceConfig(updated);
}

export async function deactivateRetailChainSource(
  sourceId: string,
): Promise<RetailChainSourceConfig> {
  return updateRetailChainSource(sourceId, { active: false });
}

export async function setRetailChainSourceManualArtifact(
  sourceId: string,
  input: {
    storagePath: string;
    fileName: string;
    mimeType: string | null;
    fileSizeBytes: number;
    checksumSha256: string;
    sourceType?: RetailChainSourceConfig["sourceType"];
  },
): Promise<RetailChainSourceConfig> {
  assertRetailIngestionModels();

  const updated = await db.nutritionRetailChainSource.update({
    where: { id: sourceId },
    data: {
      manualStoragePath: input.storagePath,
      manualFileName: input.fileName,
      manualMimeType: input.mimeType,
      manualFileSizeBytes: input.fileSizeBytes,
      manualChecksumSha256: input.checksumSha256,
      manualUploadedAt: new Date(),
      fetchMethod: "manual_upload_only",
      ...(input.sourceType ? { sourceType: input.sourceType } : {}),
    },
  });

  return toSourceConfig(updated);
}

export async function getPrioritizedChainSources(
  chainId: string,
): Promise<RetailChainSourceConfig[]> {
  return listRetailChainSources(chainId, false);
}

export async function touchRetailChainSourceVerifiedAt(
  sourceId: string,
): Promise<void> {
  assertRetailIngestionModels();
  await db.nutritionRetailChainSource.update({
    where: { id: sourceId },
    data: { lastVerifiedAt: new Date() },
    select: { id: true },
  });
}
