import { prisma } from "@/lib/db/prisma";
import { assertRetailIngestionModels } from "@/lib/nutrition/server/sourceRegistryService";

const db = prisma as any;

export interface RetailPublishResult {
  runId: string;
  publishedCount: number;
  skippedCount: number;
}

async function getNextVersionNumber(
  tx: any,
  retailItemId: string,
): Promise<number> {
  const latest = await tx.nutritionRetailItemVersion.findFirst({
    where: { retailItemId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  return (latest?.versionNumber ?? 0) + 1;
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
  let publishedCount = 0;

  await db.$transaction(async (tx: any) => {
    for (const staged of approvedRows) {
      const existing = await tx.nutritionRetailItem.findFirst({
        where: {
          chainId: run.chainId,
          normalizedName: staged.normalizedName,
        },
        select: { id: true },
      });

      const retailItem = existing
        ? await tx.nutritionRetailItem.update({
            where: { id: existing.id },
            data: {
              name: staged.name,
              normalizedName: staged.normalizedName,
              category: staged.category,
              nutrients: staged.nutrients,
              servingSize: staged.servingSize,
              servingUnit: staged.servingUnit,
              sourceType: artifact?.sourceType ?? run.sourceTypeSnapshot ?? null,
              sourceUrl: artifact?.sourceUrl ?? run.sourceUrlSnapshot ?? null,
              lastIngestionRunId: run.id,
              lastArtifactId: artifact?.id ?? null,
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
              sourceType: artifact?.sourceType ?? run.sourceTypeSnapshot ?? null,
              sourceUrl: artifact?.sourceUrl ?? run.sourceUrlSnapshot ?? null,
              lastIngestionRunId: run.id,
              lastArtifactId: artifact?.id ?? null,
              active: true,
            },
            select: { id: true },
          });

      const versionNumber = await getNextVersionNumber(tx, retailItem.id);
      await tx.nutritionRetailItemVersion.create({
        data: {
          retailItemId: retailItem.id,
          runId: run.id,
          artifactId: artifact?.id ?? null,
          chainId: run.chainId,
          itemName: staged.name,
          normalizedName: staged.normalizedName,
          category: staged.category,
          nutrients: staged.nutrients,
          servingSize: staged.servingSize,
          servingUnit: staged.servingUnit,
          sourceType: artifact?.sourceType ?? run.sourceTypeSnapshot ?? null,
          sourceUrl: artifact?.sourceUrl ?? run.sourceUrlSnapshot ?? null,
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

      publishedCount += 1;
    }

    await tx.nutritionRetailIngestionRun.update({
      where: { id: run.id },
      data: {
        status: "published",
        errorMessage: null,
        finishedAt: new Date(),
      },
    });
  });

  return {
    runId,
    publishedCount,
    skippedCount: run.stagingItems.length - publishedCount,
  };
}
