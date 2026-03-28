import { prisma } from "@/lib/db/prisma";
import type { ChainPriorityEntry } from "@/lib/nutrition/ingestion/types";
import type { IngestionRunSummary } from "@/lib/nutrition/server/ingestionRunService";
import { runChainIngestion } from "@/lib/nutrition/server/ingestionRunService";
import { assertRetailIngestionModels } from "@/lib/nutrition/server/sourceRegistryService";

const db = prisma as any;

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY));
}

export async function getMonthlyRetailQueue(
  limit = 25,
): Promise<ChainPriorityEntry[]> {
  assertRetailIngestionModels();

  const chains = await db.nutritionRetailChain.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      userItems: {
        where: { active: true },
        select: { id: true },
      },
      ingestionRuns: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { finishedAt: true, status: true },
      },
      sources: {
        where: { active: true },
        select: { priority: true },
      },
    },
  });

  const now = new Date();
  const queue = chains.map((chain: any) => {
    const missingSearches = 0;
    const userAddedItems = chain.userItems.length;
    const latestRun = chain.ingestionRuns[0];
    const staleDays = latestRun?.finishedAt
      ? daysBetween(now, latestRun.finishedAt)
      : 365;
    const pinned = chain.sources.some((source: any) => source.priority >= 100);
    const pinnedBoost = pinned ? 100 : 0;
    const score = missingSearches * 3 + userAddedItems * 2 + staleDays + pinnedBoost;

    return {
      chainId: chain.id,
      chainName: chain.name,
      score,
      missingSearches,
      userAddedItems,
      staleDays,
      pinned,
    } satisfies ChainPriorityEntry;
  });

  return queue
    .sort((a: ChainPriorityEntry, b: ChainPriorityEntry) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}

export async function runMonthlyRetailRefresh(
  options?: { limit?: number; triggeredByUserId?: string },
): Promise<{
  queue: ChainPriorityEntry[];
  runs: IngestionRunSummary[];
}> {
  const queue = await getMonthlyRetailQueue(options?.limit ?? 25);
  const runs: IngestionRunSummary[] = [];

  for (const entry of queue) {
    const run = await runChainIngestion(entry.chainId, options?.triggeredByUserId);
    runs.push(run);
  }

  return { queue, runs };
}
