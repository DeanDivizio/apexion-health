import { prisma } from "@/lib/db/prisma";
import { assertRetailIngestionModels } from "@/lib/nutrition/server/sourceRegistryService";

const db = prisma as any;

export interface RetailPublishResult {
  runId: string;
  publishedCount: number;
  skippedCount: number;
}

export async function publishRetailIngestionRun(
  runId: string,
): Promise<RetailPublishResult> {
  assertRetailIngestionModels();

  const run = await db.nutritionRetailIngestionRun.findUnique({
    where: { id: runId },
    include: {
      artifacts: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: { id: true, sourceUrl: true, sourceType: true },
      },
      stagingItems: {
        where: { approved: true },
        include: { issues: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!run) throw new Error("Ingestion run not found.");

  const approvedRows = run.stagingItems;
  if (!approvedRows.length) {
    throw new Error("No approved staging items are available to publish.");
  }

  const hasHardIssueApproved = approvedRows.some(
    (row: any) => row.hardIssueCount > 0,
  );
  if (hasHardIssueApproved) {
    throw new Error("Cannot publish while approved rows still have hard issues.");
  }

  const artifact = run.artifacts[0] ?? null;
  const sourceType = artifact?.sourceType ?? run.sourceTypeSnapshot ?? null;
  const sourceUrl = artifact?.sourceUrl ?? run.sourceUrlSnapshot ?? null;
  const artifactId = artifact?.id ?? null;

  // Bulk-fetch existing retail items for this chain so we avoid per-item lookups
  // inside each transaction.
  const normalizedNames = approvedRows.map((r: any) => r.normalizedName);
  const existingItems = await db.nutritionRetailItem.findMany({
    where: {
      chainId: run.chainId,
      normalizedName: { in: normalizedNames },
    },
    select: { id: true, normalizedName: true },
  });
  const existingByName = new Map<string, string>(
    existingItems.map((item: any) => [item.normalizedName, item.id]),
  );

  // Bulk-fetch latest version numbers so we don't query per-item inside transactions.
  const allRetailItemIds = existingItems.map((item: any) => item.id);
  const latestVersions: { retailItemId: string; _max: { versionNumber: number | null } }[] =
    allRetailItemIds.length > 0
      ? await db.nutritionRetailItemVersion.groupBy({
          by: ["retailItemId"],
          where: { retailItemId: { in: allRetailItemIds } },
          _max: { versionNumber: true },
        })
      : [];
  const versionByItemId = new Map<string, number>(
    latestVersions.map((v: any) => [v.retailItemId, v._max.versionNumber ?? 0]),
  );

  let publishedCount = 0;

  // Process each item in its own short transaction to avoid timeout.
  for (const staged of approvedRows) {
    const existingId = existingByName.get(staged.normalizedName) ?? null;

    await db.$transaction(async (tx: any) => {
      const retailItem = existingId
        ? await tx.nutritionRetailItem.update({
            where: { id: existingId },
            data: {
              name: staged.name,
              normalizedName: staged.normalizedName,
              category: staged.category,
              nutrients: staged.nutrients,
              servingSize: staged.servingSize,
              servingUnit: staged.servingUnit,
              sourceType,
              sourceUrl,
              lastIngestionRunId: run.id,
              lastArtifactId: artifactId,
              active: true,
            },
            select: { id: true },
          })
        : await tx.nutritionRetailItem.create({
            data: {
              chainId: run.chainId,
              name: staged.name,
              normalizedName: staged.normalizedName,
              category: staged.category,
              nutrients: staged.nutrients,
              servingSize: staged.servingSize,
              servingUnit: staged.servingUnit,
              sourceType,
              sourceUrl,
              lastIngestionRunId: run.id,
              lastArtifactId: artifactId,
              active: true,
            },
            select: { id: true },
          });

      const prevVersion = versionByItemId.get(retailItem.id) ?? 0;
      const versionNumber = prevVersion + 1;

      await tx.nutritionRetailItemVersion.create({
        data: {
          retailItemId: retailItem.id,
          runId: run.id,
          artifactId,
          chainId: run.chainId,
          itemName: staged.name,
          normalizedName: staged.normalizedName,
          category: staged.category,
          nutrients: staged.nutrients,
          servingSize: staged.servingSize,
          servingUnit: staged.servingUnit,
          sourceType,
          sourceUrl,
          versionNumber,
          isPublished: true,
        },
      });

      await tx.nutritionRetailItemAlias.upsert({
        where: {
          chainId_normalizedAlias: {
            chainId: run.chainId,
            normalizedAlias: staged.normalizedName,
          },
        },
        create: {
          chainId: run.chainId,
          retailItemId: retailItem.id,
          alias: staged.name,
          normalizedAlias: staged.normalizedName,
          active: true,
        },
        update: {
          retailItemId: retailItem.id,
          alias: staged.name,
          active: true,
        },
      });

      // Track the new version number for subsequent items that might create
      // a new retail item and then appear again (shouldn't happen in practice
      // since normalizedNames are unique per batch, but safe to track).
      versionByItemId.set(retailItem.id, versionNumber);

      // If this was a new item, record its id so duplicates in the same batch
      // (if any got through) would hit the update path.
      if (!existingId) {
        existingByName.set(staged.normalizedName, retailItem.id);
      }
    });

    publishedCount += 1;
  }

  await db.nutritionRetailIngestionRun.update({
    where: { id: run.id },
    data: {
      status: "published",
      errorMessage: null,
      finishedAt: new Date(),
    },
  });

  return {
    runId,
    publishedCount,
    skippedCount: run.stagingItems.length - publishedCount,
  };
}
