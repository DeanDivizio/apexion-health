import { prisma } from "@/lib/db/prisma";
import { normalizedRetailItemCandidateSchema } from "@/lib/nutrition/ingestion/schemas";
import type {
  NutritionIngestionRunStatus,
  ValidationIssuePayload,
} from "@/lib/nutrition/ingestion/types";
import type { StageRetailItemsInput } from "@/lib/nutrition/ingestion/schemas";
import type { NutrientProfile } from "@/lib/nutrition/types";
import { assertRetailIngestionModels } from "@/lib/nutrition/server/sourceRegistryService";

const db = prisma as any;

export interface RetailStagingIssueView {
  id: string;
  severity: "hard" | "soft" | "info";
  code: string;
  message: string;
}

export interface RetailStagingItemView {
  id: string;
  runId: string;
  chainId: string;
  name: string;
  normalizedName: string;
  category: string | null;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    [key: string]: number | undefined;
  };
  servingSize: number | null;
  servingUnit: string | null;
  extractionMethod: "csv_parser" | "xlsx_parser" | "pdf_table_parser" | "ocr_llm";
  confidence: number | null;
  hardIssueCount: number;
  softIssueCount: number;
  reviewed: boolean;
  approved: boolean;
  issues: RetailStagingIssueView[];
}

function normalizeRetailItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateCandidate(
  candidate: {
    name: string;
    normalizedName: string;
    category: string | null;
    nutrients: NutrientProfile;
    servingSize: number | null;
    servingUnit: string | null;
  },
  duplicateNames: Set<string>,
): ValidationIssuePayload[] {
  const issues: ValidationIssuePayload[] = [];
  const calories = candidate.nutrients.calories ?? 0;
  const protein = candidate.nutrients.protein ?? 0;
  const carbs = candidate.nutrients.carbs ?? 0;
  const fat = candidate.nutrients.fat ?? 0;

  if (!candidate.name.trim()) {
    issues.push({
      severity: "hard",
      code: "missing_name",
      message: "Item name is required.",
    });
  }

  if (!candidate.normalizedName) {
    issues.push({
      severity: "hard",
      code: "invalid_normalized_name",
      message: "Normalized item name is missing.",
    });
  }

  for (const [key, value] of Object.entries(candidate.nutrients)) {
    if (value == null) continue;
    if (!Number.isFinite(value)) {
      issues.push({
        severity: "hard",
        code: "invalid_nutrient_number",
        message: `${key} must be a finite number.`,
      });
      continue;
    }
    if (value < 0) {
      issues.push({
        severity: "hard",
        code: "negative_nutrient",
        message: `${key} cannot be negative.`,
      });
    }
  }

  if (calories > 5000) {
    issues.push({
      severity: "soft",
      code: "high_calorie_outlier",
      message: "Calories are unusually high; review this item.",
    });
  }

  if (candidate.servingSize != null && !candidate.servingUnit) {
    issues.push({
      severity: "hard",
      code: "missing_serving_unit",
      message: "Serving unit is required when serving size is present.",
    });
  }

  if (candidate.servingSize != null && candidate.servingSize <= 0) {
    issues.push({
      severity: "hard",
      code: "invalid_serving_size",
      message: "Serving size must be greater than zero when provided.",
    });
  }

  const derivedCalories = protein * 4 + carbs * 4 + fat * 9;
  if (calories > 0 && derivedCalories > 0) {
    const delta = Math.abs(calories - derivedCalories);
    const tolerance = Math.max(40, calories * 0.25);
    if (delta > tolerance) {
      issues.push({
        severity: "soft",
        code: "macro_calorie_mismatch",
        message:
          "Calories are not aligned with macro totals (4/4/9 rule); review this row.",
        meta: {
          calories,
          derivedCalories,
          delta,
          tolerance,
        },
      });
    }
  }

  if (duplicateNames.has(candidate.normalizedName)) {
    issues.push({
      severity: "hard",
      code: "duplicate_name_in_batch",
      message: "Duplicate normalized item name in this staging batch.",
    });
  }

  return issues;
}

function toStagingView(row: any): RetailStagingItemView {
  return {
    id: row.id,
    runId: row.runId,
    chainId: row.chainId,
    name: row.name,
    normalizedName: row.normalizedName,
    category: row.category ?? null,
    nutrients: row.nutrients,
    servingSize: row.servingSize ?? null,
    servingUnit: row.servingUnit ?? null,
    extractionMethod: row.extractionMethod,
    confidence: row.confidence ?? null,
    hardIssueCount: row.hardIssueCount,
    softIssueCount: row.softIssueCount,
    reviewed: row.reviewed,
    approved: row.approved,
    issues: (row.issues ?? []).map((issue: any) => ({
      id: issue.id,
      severity: issue.severity,
      code: issue.code,
      message: issue.message,
    })),
  };
}

async function recomputeRunStatus(runId: string): Promise<NutritionIngestionRunStatus> {
  const [run, rows] = await Promise.all([
    db.nutritionRetailIngestionRun.findUnique({
      where: { id: runId },
      select: { status: true },
    }),
    db.nutritionRetailStagingItem.findMany({
      where: { runId },
      select: {
        reviewed: true,
        approved: true,
        hardIssueCount: true,
      },
    }),
  ]);

  if (!run) throw new Error("Ingestion run not found.");
  if (!rows.length) return "staged";

  const pendingReview = rows.some((row: any) => !row.reviewed);
  const approvedRows = rows.filter((row: any) => row.approved);
  const approvedWithHardIssues = approvedRows.some(
    (row: any) => row.hardIssueCount > 0,
  );

  if (!approvedRows.length || pendingReview || approvedWithHardIssues) {
    return "review_required";
  }

  return "publish_ready";
}

export async function stageRetailItemsForRun(
  runId: string,
  candidates: StageRetailItemsInput,
  reviewedByUserId?: string,
  artifactId?: string | null,
): Promise<{ stagedCount: number; hardIssues: number; softIssues: number }> {
  assertRetailIngestionModels();

  if (!candidates.length) {
    throw new Error("No candidate items were provided for staging.");
  }

  const run = await db.nutritionRetailIngestionRun.findUnique({
    where: { id: runId },
    select: { id: true, chainId: true, status: true },
  });
  if (!run) throw new Error("Ingestion run not found.");

  const existingNames = new Set<string>();
  const existingRows = await db.nutritionRetailStagingItem.findMany({
    where: { runId },
    select: { normalizedName: true },
  });
  for (const row of existingRows) existingNames.add(row.normalizedName);

  const batchSeen = new Set<string>();
  let hardIssues = 0;
  let softIssues = 0;

  await db.$transaction(async (tx: any) => {
    for (const rawCandidate of candidates) {
      const normalizedName = normalizeRetailItemName(rawCandidate.name);
      const parsedCandidate = normalizedRetailItemCandidateSchema.parse({
        ...rawCandidate,
        normalizedName,
      });
      const candidateNutrients = parsedCandidate.nutrients as NutrientProfile;
      const duplicateNames = new Set<string>();
      if (existingNames.has(parsedCandidate.normalizedName)) {
        duplicateNames.add(parsedCandidate.normalizedName);
      }
      if (batchSeen.has(parsedCandidate.normalizedName)) {
        duplicateNames.add(parsedCandidate.normalizedName);
      }

      const issues = validateCandidate(
        {
          name: parsedCandidate.name,
          normalizedName: parsedCandidate.normalizedName,
          category: parsedCandidate.category,
          nutrients: candidateNutrients,
          servingSize: parsedCandidate.servingSize,
          servingUnit: parsedCandidate.servingUnit,
        },
        duplicateNames,
      );
      const itemHardIssueCount = issues.filter((issue) => issue.severity === "hard").length;
      const itemSoftIssueCount = issues.filter((issue) => issue.severity === "soft").length;
      hardIssues += itemHardIssueCount;
      softIssues += itemSoftIssueCount;

      const staged = await tx.nutritionRetailStagingItem.create({
        data: {
          runId,
          artifactId: artifactId ?? null,
          chainId: run.chainId,
          name: parsedCandidate.name,
          normalizedName: parsedCandidate.normalizedName,
          category: parsedCandidate.category,
          nutrients: candidateNutrients,
          servingSize: parsedCandidate.servingSize,
          servingUnit: parsedCandidate.servingUnit,
          extractionMethod: parsedCandidate.extractionMethod,
          confidence: parsedCandidate.confidence,
          hardIssueCount: itemHardIssueCount,
          softIssueCount: itemSoftIssueCount,
          reviewed: false,
          approved: itemHardIssueCount === 0,
          reviewedByUserId: itemHardIssueCount === 0 ? reviewedByUserId ?? null : null,
          reviewedAt: itemHardIssueCount === 0 ? new Date() : null,
        },
        select: { id: true },
      });

      if (issues.length) {
        await tx.nutritionRetailStagingIssue.createMany({
          data: issues.map((issue) => ({
            stagingItemId: staged.id,
            severity: issue.severity,
            code: issue.code,
            message: issue.message,
            meta: issue.meta ?? null,
          })),
        });
      }

      batchSeen.add(parsedCandidate.normalizedName);
    }

    await tx.nutritionRetailIngestionRun.update({
      where: { id: runId },
      data: {
        status: "review_required",
        errorMessage: null,
      },
    });
  });

  return {
    stagedCount: candidates.length,
    hardIssues,
    softIssues,
  };
}

export async function listRetailStagingItems(
  runId: string,
): Promise<RetailStagingItemView[]> {
  assertRetailIngestionModels();

  const rows = await db.nutritionRetailStagingItem.findMany({
    where: { runId },
    orderBy: [{ approved: "desc" }, { hardIssueCount: "asc" }, { name: "asc" }],
    include: {
      issues: {
        orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  return rows.map(toStagingView);
}

export async function updateRetailStagingItem(
  stagingItemId: string,
  input: {
    name?: string;
    category?: string | null;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    servingSize?: number | null;
    servingUnit?: string | null;
  },
  reviewerUserId: string,
): Promise<RetailStagingItemView> {
  assertRetailIngestionModels();

  const existing = await db.nutritionRetailStagingItem.findUnique({
    where: { id: stagingItemId },
    include: { issues: true },
  });
  if (!existing) throw new Error("Staging item not found.");

  const nutrients = {
    ...(existing.nutrients ?? {}),
    ...(input.calories !== undefined ? { calories: input.calories } : {}),
    ...(input.protein !== undefined ? { protein: input.protein } : {}),
    ...(input.carbs !== undefined ? { carbs: input.carbs } : {}),
    ...(input.fat !== undefined ? { fat: input.fat } : {}),
  };
  const name = input.name !== undefined ? input.name : existing.name;
  const candidate = {
    name,
    normalizedName: normalizeRetailItemName(name),
    category: input.category !== undefined ? input.category : existing.category,
    nutrients: nutrients as NutrientProfile,
    servingSize:
      input.servingSize !== undefined ? input.servingSize : existing.servingSize,
    servingUnit:
      input.servingUnit !== undefined ? input.servingUnit : existing.servingUnit,
    extractionMethod: existing.extractionMethod,
    confidence: existing.confidence ?? null,
  };

  const duplicateNames = new Set<string>();
  const sameNameRows = await db.nutritionRetailStagingItem.findMany({
    where: {
      runId: existing.runId,
      normalizedName: candidate.normalizedName,
      NOT: { id: existing.id },
    },
    select: { id: true },
    take: 1,
  });
  if (sameNameRows.length) duplicateNames.add(candidate.normalizedName);

  const issues = validateCandidate(candidate, duplicateNames);
  const hardIssueCount = issues.filter((issue) => issue.severity === "hard").length;
  const softIssueCount = issues.filter((issue) => issue.severity === "soft").length;

  const updated = await db.$transaction(async (tx: any) => {
    await tx.nutritionRetailStagingIssue.deleteMany({
      where: { stagingItemId },
    });

    const row = await tx.nutritionRetailStagingItem.update({
      where: { id: stagingItemId },
      data: {
        name: candidate.name,
        normalizedName: candidate.normalizedName,
        category: candidate.category,
        nutrients: candidate.nutrients,
        servingSize: candidate.servingSize,
        servingUnit: candidate.servingUnit,
        hardIssueCount,
        softIssueCount,
        reviewed: true,
        approved: hardIssueCount === 0,
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
      },
      include: { issues: true },
    });

    if (issues.length) {
      await tx.nutritionRetailStagingIssue.createMany({
        data: issues.map((issue) => ({
          stagingItemId,
          severity: issue.severity,
          code: issue.code,
          message: issue.message,
          meta: issue.meta ?? null,
        })),
      });
    }

    return tx.nutritionRetailStagingItem.findUnique({
      where: { id: row.id },
      include: { issues: true },
    });
  });

  const status = await recomputeRunStatus(existing.runId);
  await db.nutritionRetailIngestionRun.update({
    where: { id: existing.runId },
    data: {
      status,
      errorMessage: null,
    },
  });

  return toStagingView(updated);
}

export async function setRetailStagingItemApproval(
  stagingItemId: string,
  approved: boolean,
  reviewerUserId: string,
): Promise<RetailStagingItemView> {
  assertRetailIngestionModels();

  const row = await db.nutritionRetailStagingItem.findUnique({
    where: { id: stagingItemId },
    select: { id: true, runId: true, hardIssueCount: true },
  });
  if (!row) throw new Error("Staging item not found.");
  if (approved && row.hardIssueCount > 0) {
    throw new Error("Cannot approve a row with hard issues.");
  }

  const updated = await db.nutritionRetailStagingItem.update({
    where: { id: stagingItemId },
    data: {
      approved,
      reviewed: true,
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    },
    include: { issues: true },
  });

  const status = await recomputeRunStatus(row.runId);
  await db.nutritionRetailIngestionRun.update({
    where: { id: row.runId },
    data: {
      status,
      errorMessage: null,
    },
  });

  return toStagingView(updated);
}
