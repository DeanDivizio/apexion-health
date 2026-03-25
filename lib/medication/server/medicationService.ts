import { prisma } from "@/lib/db/prisma";
import { cacheTag, cacheLife } from "next/cache";
import { getUtcBoundsForLocalDate } from "@/lib/dates/dateStr";
import type {
  MedicationBootstrap,
  MedicationDraftItem,
  MedicationLogSessionView,
  MedicationPresetView,
  SubstanceCatalogItemView,
} from "@/lib/medication/types";
import type {
  CreateMedicationLogSessionInput,
  CreateMedicationPresetInput,
  CreateSubstanceInput,
  MedicationDraftItemInput,
} from "@/lib/medication/schemas";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;
type TxClient = any;

function hasCatalogModels() {
  return (
    typeof db?.substance?.findMany === "function" &&
    typeof db?.substance?.create === "function" &&
    typeof db?.substanceDeliveryMethod?.findMany === "function" &&
    typeof db?.substancePreset?.findMany === "function" &&
    typeof db?.substancePreset?.create === "function"
  );
}

function assertCatalogModelsAvailable() {
  if (!hasCatalogModels()) {
    throw new Error(
      "Medication catalog models are unavailable. Run migrations and regenerate Prisma client.",
    );
  }
}

function generateKey(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

function mapSubstanceForUi(raw: any): SubstanceCatalogItemView {
  return {
    id: raw.id,
    displayName: raw.displayName,
    isCompound: raw.isCompound,
    defaultDoseUnit: raw.defaultDoseUnit,
    selfIngredientKey: raw.selfIngredientKey,
    brand: raw.brand,
    notes: raw.notes,
    methods: (raw.methodLinks ?? []).map((link: any) => ({
      id: link.deliveryMethod.id,
      key: link.deliveryMethod.key,
      label: link.deliveryMethod.label,
    })),
    variants: (raw.variants ?? []).map((v: any) => ({
      id: v.id,
      key: v.key,
      label: v.label,
      deliveryMethodId: v.deliveryMethodId,
    })),
    ingredients: (raw.ingredients ?? []).map((i: any) => ({
      id: i.id,
      ingredientKey: i.ingredientKey,
      ingredientName: i.ingredientName,
      amountPerServing: i.amountPerServing,
      unit: i.unit,
    })),
  };
}

function toDraftItem(row: any): MedicationDraftItem {
  return {
    substanceId: row.substanceId,
    snapshotName: row.snapshotName,
    doseValue: row.doseValue,
    doseUnit: row.doseUnit,
    compoundServings: row.compoundServings,
    deliveryMethodId: row.deliveryMethodId,
    variantId: row.variantId,
    injectionDepth: row.injectionDepth ?? null,
  };
}

function toSessionView(row: any): MedicationLogSessionView {
  return {
    id: row.id,
    loggedAtIso: row.loggedAt.toISOString(),
    presetId: row.presetId ?? null,
    notes: row.notes ?? null,
    items: (row.items ?? []).map(toDraftItem),
  };
}

const substanceInclude = {
  methodLinks: {
    include: {
      deliveryMethod: {
        select: { id: true, key: true, label: true },
      },
    },
  },
  variants: {
    where: { active: true },
    orderBy: { label: "asc" },
    select: { id: true, key: true, label: true, deliveryMethodId: true },
  },
  ingredients: {
    where: { active: true },
    orderBy: { ingredientName: "asc" },
    select: {
      id: true,
      ingredientKey: true,
      ingredientName: true,
      amountPerServing: true,
      unit: true,
    },
  },
} as const;

// ─── Validation ─────────────────────────────────────────────────────────────

async function validateItemReferences(
  tx: TxClient,
  userId: string,
  items: MedicationDraftItemInput[],
) {
  const substanceIds = [...new Set(items.map((i) => i.substanceId))];
  const substances = await tx.substance.findMany({
    where: {
      id: { in: substanceIds },
      active: true,
      OR: [{ ownerUserId: null }, { ownerUserId: userId }],
    },
    select: { id: true },
  });
  const validSubstanceIds = new Set(substances.map((s: any) => s.id));
  for (const item of items) {
    if (!validSubstanceIds.has(item.substanceId)) {
      throw new Error("One or more referenced substances are not accessible.");
    }
  }

  const methodIds = [
    ...new Set(
      items.map((i) => i.deliveryMethodId).filter(Boolean) as string[],
    ),
  ];
  if (methodIds.length) {
    const methods = await tx.substanceDeliveryMethod.findMany({
      where: { id: { in: methodIds }, active: true },
      select: { id: true },
    });
    const validMethodIds = new Set(methods.map((m: any) => m.id));
    for (const item of items) {
      if (item.deliveryMethodId && !validMethodIds.has(item.deliveryMethodId)) {
        throw new Error("One or more delivery methods are not valid.");
      }
    }
  }

  const variantIds = [
    ...new Set(items.map((i) => i.variantId).filter(Boolean) as string[]),
  ];
  if (variantIds.length) {
    const variants = await tx.substanceVariant.findMany({
      where: { id: { in: variantIds }, active: true },
      select: { id: true, substanceId: true },
    });
    const variantMap = new Map(
      variants.map((v: any) => [v.id, v.substanceId]),
    );
    for (const item of items) {
      if (
        item.variantId &&
        variantMap.get(item.variantId) !== item.substanceId
      ) {
        throw new Error(
          "One or more variants do not belong to their substance.",
        );
      }
    }
  }
}

async function persistLogItemsForSession(
  tx: TxClient,
  userId: string,
  sessionId: string,
  items: MedicationDraftItemInput[],
) {
  // Pre-fetch all substance data needed for ingredient persistence
  const substanceIds = [...new Set(items.map((i) => i.substanceId))];
  const [compoundIngredients, substanceMeta] = await Promise.all([
    tx.substanceIngredient.findMany({
      where: { substanceId: { in: substanceIds }, active: true },
      select: {
        id: true,
        substanceId: true,
        ingredientKey: true,
        ingredientName: true,
        amountPerServing: true,
        unit: true,
      },
    }),
    tx.substance.findMany({
      where: { id: { in: substanceIds } },
      select: { id: true, selfIngredientKey: true, displayName: true },
    }),
  ]);

  const ingredientsBySubstance = new Map<string, any[]>();
  for (const ing of compoundIngredients) {
    const list = ingredientsBySubstance.get(ing.substanceId) ?? [];
    list.push(ing);
    ingredientsBySubstance.set(ing.substanceId, list);
  }
  const substanceMap = new Map<
    string,
    { id: string; selfIngredientKey: string | null; displayName: string }
  >(substanceMeta.map((s: any) => [s.id, s]));

  // Build canonical ingredient name lookup from compound ingredients
  const canonicalNameByKey = new Map<string, string>();
  for (const ing of compoundIngredients) {
    if (!canonicalNameByKey.has(ing.ingredientKey)) {
      canonicalNameByKey.set(ing.ingredientKey, ing.ingredientName);
    }
  }

  // For self-ingredient keys not already covered, check globally
  const selfIngredientKeys = substanceMeta
    .filter((s: any) => s.selfIngredientKey)
    .map((s: any) => s.selfIngredientKey as string)
    .filter((k: string) => !canonicalNameByKey.has(k));

  if (selfIngredientKeys.length) {
    const globalIngredients = await tx.substanceIngredient.findMany({
      where: { ingredientKey: { in: selfIngredientKeys }, active: true },
      select: { ingredientKey: true, ingredientName: true },
    });
    for (const gi of globalIngredients) {
      if (!canonicalNameByKey.has(gi.ingredientKey)) {
        canonicalNameByKey.set(gi.ingredientKey, gi.ingredientName);
      }
    }
  }

  // Create log items and collect ingredient rows for batch insert
  const ingredientRows: any[] = [];
  for (const [index, item] of items.entries()) {
    const logItem = await tx.substanceLogItem.create({
      data: {
        sessionId,
        userId,
        substanceId: item.substanceId,
        snapshotName: item.snapshotName,
        doseValue: item.doseValue ?? null,
        doseUnit: item.doseUnit ?? null,
        compoundServings: item.compoundServings ?? null,
        deliveryMethodId: item.deliveryMethodId ?? null,
        variantId: item.variantId ?? null,
        injectionDepth: item.injectionDepth ?? null,
        sortOrder: index,
      },
    });

    if (item.compoundServings != null) {
      const ings = ingredientsBySubstance.get(item.substanceId) ?? [];
      for (const ing of ings) {
        ingredientRows.push({
          logItemId: logItem.id,
          sourceIngredientId: ing.id,
          ingredientKey: ing.ingredientKey,
          ingredientName: ing.ingredientName,
          amountTotal: ing.amountPerServing * item.compoundServings,
          unit: ing.unit,
          sourceAmountPerServing: ing.amountPerServing,
          sourceServings: item.compoundServings,
        });
      }
    }

    if (item.doseValue != null && item.doseValue > 0) {
      const substance = substanceMap.get(item.substanceId);
      if (substance?.selfIngredientKey) {
        ingredientRows.push({
          logItemId: logItem.id,
          sourceIngredientId: null,
          ingredientKey: substance.selfIngredientKey,
          ingredientName:
            canonicalNameByKey.get(substance.selfIngredientKey) ??
            substance.displayName,
          amountTotal: item.doseValue,
          unit: item.doseUnit ?? "mg",
          sourceAmountPerServing: item.doseValue,
          sourceServings: 1,
        });
      }
    }
  }

  if (ingredientRows.length) {
    await tx.substanceLogItemIngredient.createMany({
      data: ingredientRows,
    });
  }
}

// ─── Meds Day Summary (for home screen) ──────────────────────────────────────

export interface MedsDaySummarySession {
  sessionId: string;
  loggedAt: string;
  items: Array<{
    substanceName: string;
    doseValue: number | null;
    doseUnit: string | null;
    compoundServings: number | null;
    deliveryMethod: string | null;
  }>;
}

export async function getMedsDaySummary(
  userId: string,
  dateStr: string,
  timezoneOffsetMinutes = 0,
): Promise<MedsDaySummarySession[]> {
  "use cache";
  cacheTag("medsSummary");
  cacheLife("hours");

  if (!hasCatalogModels()) return [];
  const { startUtc, endUtcExclusive } = getUtcBoundsForLocalDate(
    dateStr,
    timezoneOffsetMinutes,
  );

  try {
    const sessions = await db.substanceLogSession.findMany({
      where: {
        userId,
        loggedAt: {
          gte: startUtc,
          lt: endUtcExclusive,
        },
      },
      orderBy: { loggedAt: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            snapshotName: true,
            doseValue: true,
            doseUnit: true,
            compoundServings: true,
            deliveryMethod: {
              select: { label: true },
            },
          },
        },
      },
    });

    return sessions.map((session: any) => ({
      sessionId: session.id,
      loggedAt: session.loggedAt.toISOString(),
      items: session.items.map((item: any) => ({
        substanceName: item.snapshotName,
        doseValue: item.doseValue,
        doseUnit: item.doseUnit,
        compoundServings: item.compoundServings,
        deliveryMethod: item.deliveryMethod?.label ?? null,
      })),
    }));
  } catch {
    return [];
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getMedicationBootstrap(
  userId: string,
): Promise<MedicationBootstrap> {
  if (!hasCatalogModels()) {
    return { substances: [], deliveryMethods: [], presets: [] };
  }

  let substances: any[] = [];
  let deliveryMethods: any[] = [];
  let presets: any[] = [];

  try {
    [substances, deliveryMethods, presets] = await Promise.all([
      db.substance.findMany({
        where: {
          active: true,
          OR: [{ ownerUserId: null }, { ownerUserId: userId }],
        },
        orderBy: { displayName: "asc" },
        include: substanceInclude,
      }),
      db.substanceDeliveryMethod.findMany({
        where: { active: true },
        orderBy: { label: "asc" },
        select: { id: true, key: true, label: true },
      }),
      db.substancePreset.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            select: {
              substanceId: true,
              snapshotName: true,
              doseValue: true,
              doseUnit: true,
              compoundServings: true,
              deliveryMethodId: true,
              variantId: true,
              injectionDepth: true,
            },
          },
        },
      }),
    ]);
  } catch {
    return { substances: [], deliveryMethods: [], presets: [] };
  }

  const mappedPresets: MedicationPresetView[] = presets.map((p: any) => ({
    id: p.id,
    name: p.name,
    items: p.items.map(toDraftItem),
  }));

  return {
    substances: substances.map(mapSubstanceForUi),
    deliveryMethods,
    presets: mappedPresets,
  };
}

export async function listMedicationLogSessions(
  userId: string,
): Promise<MedicationLogSessionView[]> {
  assertCatalogModelsAvailable();

  const sessions = await db.substanceLogSession.findMany({
    where: { userId },
    orderBy: { loggedAt: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        select: {
          substanceId: true,
          snapshotName: true,
          doseValue: true,
          doseUnit: true,
          compoundServings: true,
          deliveryMethodId: true,
          variantId: true,
          injectionDepth: true,
        },
      },
    },
  });

  return sessions.map(toSessionView);
}

export async function createSubstance(
  userId: string,
  input: CreateSubstanceInput,
) {
  assertCatalogModelsAvailable();

  const base = generateKey(input.displayName) || "custom-substance";
  const key = `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const selfIngredientKey =
    !input.isCompound ? generateKey(input.displayName) || null : null;

  const ingredientCreates =
    input.isCompound && input.ingredients.length
      ? input.ingredients.map((ing, idx) => ({
          ingredientKey: generateKey(ing.name) || `ingredient-${idx}`,
          ingredientName: ing.name.trim(),
          amountPerServing: ing.amountPerServing,
          unit: ing.unit,
          active: true,
        }))
      : [];

  const created = await db.substance.create({
    data: {
      ownerUserId: userId,
      key,
      displayName: input.displayName.trim(),
      isCompound: input.isCompound,
      selfIngredientKey,
      defaultDoseUnit: input.isCompound
        ? null
        : (input.defaultDoseUnit ?? "mg"),
      brand: input.brand ?? null,
      notes: input.notes ?? null,
      active: true,
      methodLinks: input.methodIds.length
        ? {
            create: input.methodIds.map((methodId: string) => ({
              deliveryMethodId: methodId,
            })),
          }
        : undefined,
      ingredients: ingredientCreates.length
        ? { create: ingredientCreates }
        : undefined,
    },
    include: substanceInclude,
  });

  return mapSubstanceForUi(created);
}

export async function createMedicationLogSession(
  userId: string,
  input: CreateMedicationLogSessionInput,
) {
  assertCatalogModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    await validateItemReferences(tx, userId, input.items);

    const session = await tx.substanceLogSession.create({
      data: {
        userId,
        loggedAt: new Date(input.loggedAtIso),
        presetId: input.presetId ?? null,
        notes: input.notes ?? null,
      },
    });

    await persistLogItemsForSession(tx, userId, session.id, input.items);

    return session;
  });
}

export async function updateMedicationLogSession(
  userId: string,
  sessionId: string,
  input: CreateMedicationLogSessionInput,
) {
  assertCatalogModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    const existing = await tx.substanceLogSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Medication log session not found.");
    }

    await validateItemReferences(tx, userId, input.items);

    await tx.substanceLogSession.update({
      where: { id: sessionId },
      data: {
        loggedAt: new Date(input.loggedAtIso),
        presetId: input.presetId ?? null,
        notes: input.notes ?? null,
      },
    });

    await tx.substanceLogItem.deleteMany({ where: { sessionId } });
    await persistLogItemsForSession(tx, userId, sessionId, input.items);
  });
}

export async function deleteMedicationLogSession(userId: string, sessionId: string) {
  assertCatalogModelsAvailable();

  const session = await db.substanceLogSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  if (!session) {
    throw new Error("Medication log session not found.");
  }

  await db.substanceLogSession.delete({ where: { id: sessionId } });
}

export async function createMedicationPreset(
  userId: string,
  input: CreateMedicationPresetInput,
) {
  assertCatalogModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    await validateItemReferences(tx, userId, input.items);

    const preset = await tx.substancePreset.create({
      data: { userId, name: input.name.trim() },
    });

    await tx.substancePresetItem.createMany({
      data: input.items.map((item, index) => ({
        presetId: preset.id,
        substanceId: item.substanceId,
        snapshotName: item.snapshotName,
        doseValue: item.doseValue ?? null,
        doseUnit: item.doseUnit ?? null,
        compoundServings: item.compoundServings ?? null,
        deliveryMethodId: item.deliveryMethodId ?? null,
        variantId: item.variantId ?? null,
        injectionDepth: item.injectionDepth ?? null,
        sortOrder: index,
      })),
    });

    return preset;
  });
}
