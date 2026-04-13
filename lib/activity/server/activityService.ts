import { prisma } from "@/lib/db/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { normalizeDateInput } from "@/lib/dates/dateStr";
import type {
  ActivityBootstrap,
  ActivityContributionDay,
  ActivityDateRangeSummary,
  ActivityDaySummaryLog,
  ActivityDimensionView,
  ActivityLogValueView,
  ActivityLogView,
  ActivityTypeView,
} from "@/lib/activity/types";
import type {
  CreateActivityLogInput,
  CreateActivityTypeInput,
  ListActivityLogsOptions,
  UpdateActivityDimensionsInput,
  UpdateActivityTypeInput,
} from "@/lib/activity/schemas";
import { summarizeActivityValue } from "@/lib/activity/summary";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;
type TxClient = any;

function hasActivityModels() {
  return (
    typeof db?.activityType?.findMany === "function" &&
    typeof db?.activityLog?.findMany === "function" &&
    typeof db?.activityDimension?.findMany === "function"
  );
}

function assertActivityModelsAvailable() {
  if (!hasActivityModels()) {
    throw new Error(
      "Activity models are unavailable. Run migrations and regenerate Prisma client.",
    );
  }
}

function toDimensionView(row: any): ActivityDimensionView {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    kind: row.kind,
    required: row.required,
    sortOrder: row.sortOrder,
    config: (row.config as ActivityDimensionView["config"]) ?? null,
  };
}

function toActivityTypeView(row: any): ActivityTypeView {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? null,
    icon: row.icon ?? null,
    dimensions: (row.dimensions ?? []).map(toDimensionView),
  };
}

function toLogValueView(row: any): ActivityLogValueView {
  return {
    key: row.keySnapshot,
    label: row.labelSnapshot,
    kind: row.kindSnapshot,
    textValue: row.textValue ?? null,
    numberValue: row.numberValue ?? null,
    unitValue: row.unitValue ?? null,
    dateValue: row.dateValue ?? null,
    timeValue: row.timeValue ?? null,
    dateTimeValueIso: row.dateTimeValue ? row.dateTimeValue.toISOString() : null,
    intValue: row.intValue ?? null,
    jsonValue: row.jsonValue ?? null,
  };
}

function toActivityLogView(row: any): ActivityLogView {
  return {
    id: row.id,
    activityTypeId: row.activityTypeId,
    activityName: row.activityType?.name ?? "Activity",
    activityColor: row.activityType?.color ?? null,
    loggedAtIso: row.loggedAt.toISOString(),
    dateStr: row.dateStr,
    values: (row.values ?? []).map(toLogValueView),
  };
}

function toDateStrFromLoggedAt(
  loggedAtIso: string,
  timezoneOffsetMinutes: number,
): string {
  const loggedAt = new Date(loggedAtIso);
  if (Number.isNaN(loggedAt.getTime())) {
    return normalizeDateInput(new Date().toISOString().slice(0, 10)).compactDateStr;
  }
  const localMs = loggedAt.getTime() - timezoneOffsetMinutes * 60 * 1000;
  const localDate = new Date(localMs);
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(localDate.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function buildDateRangeBounds(
  startDate: string,
  endDate: string,
): { start: string; end: string } {
  const start = normalizeDateInput(startDate).compactDateStr;
  const end = normalizeDateInput(endDate).compactDateStr;
  if (start <= end) return { start, end };
  return { start: end, end: start };
}

export async function getActivityBootstrap(
  userId: string,
): Promise<ActivityBootstrap> {
  if (!hasActivityModels()) return { activityTypes: [] };

  try {
    const rows = await db.activityType.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        dimensions: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    return { activityTypes: rows.map(toActivityTypeView) };
  } catch {
    return { activityTypes: [] };
  }
}

export async function listActivityTypes(userId: string): Promise<ActivityTypeView[]> {
  assertActivityModelsAvailable();
  const rows = await db.activityType.findMany({
    where: { userId, archivedAt: null },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      dimensions: {
        where: { archivedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  return rows.map(toActivityTypeView);
}

export async function createActivityType(
  userId: string,
  input: CreateActivityTypeInput,
): Promise<ActivityTypeView> {
  assertActivityModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    const type = await tx.activityType.create({
      data: {
        userId,
        name: input.name.trim(),
        color: input.color ?? null,
        icon: input.icon ?? null,
      },
    });

    if (input.dimensions.length > 0) {
      await tx.activityDimension.createMany({
        data: input.dimensions.map((dimension, index) => ({
          activityTypeId: type.id,
          key: dimension.key,
          label: dimension.label,
          kind: dimension.kind,
          required: dimension.required,
          sortOrder: dimension.sortOrder ?? index,
          config: dimension.config ?? null,
        })),
      });
    }

    const full = await tx.activityType.findUniqueOrThrow({
      where: { id: type.id },
      include: {
        dimensions: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return toActivityTypeView(full);
  });
}

export async function updateActivityType(
  userId: string,
  activityTypeId: string,
  input: UpdateActivityTypeInput,
): Promise<ActivityTypeView> {
  assertActivityModelsAvailable();

  const existing = await db.activityType.findFirst({
    where: { id: activityTypeId, userId, archivedAt: null },
    select: { id: true },
  });
  if (!existing) throw new Error("Activity type not found.");

  const updated = await db.activityType.update({
    where: { id: activityTypeId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
    },
    include: {
      dimensions: {
        where: { archivedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return toActivityTypeView(updated);
}

export async function replaceActivityDimensions(
  userId: string,
  activityTypeId: string,
  input: UpdateActivityDimensionsInput,
): Promise<ActivityTypeView> {
  assertActivityModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    const type = await tx.activityType.findFirst({
      where: { id: activityTypeId, userId, archivedAt: null },
      select: { id: true },
    });
    if (!type) throw new Error("Activity type not found.");

    await tx.activityDimension.deleteMany({
      where: { activityTypeId },
    });

    if (input.dimensions.length > 0) {
      await tx.activityDimension.createMany({
        data: input.dimensions.map((dimension, index) => ({
          activityTypeId,
          key: dimension.key,
          label: dimension.label,
          kind: dimension.kind,
          required: dimension.required,
          sortOrder: dimension.sortOrder ?? index,
          config: dimension.config ?? null,
        })),
      });
    }

    const full = await tx.activityType.findUniqueOrThrow({
      where: { id: activityTypeId },
      include: {
        dimensions: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return toActivityTypeView(full);
  });
}

export async function archiveActivityType(
  userId: string,
  activityTypeId: string,
): Promise<void> {
  assertActivityModelsAvailable();

  const existing = await db.activityType.findFirst({
    where: { id: activityTypeId, userId, archivedAt: null },
    select: { id: true },
  });
  if (!existing) throw new Error("Activity type not found.");

  await db.activityType.update({
    where: { id: activityTypeId },
    data: { archivedAt: new Date() },
  });
}

export async function createActivityLog(
  userId: string,
  input: CreateActivityLogInput,
): Promise<ActivityLogView> {
  assertActivityModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    const activityType = await tx.activityType.findFirst({
      where: {
        id: input.activityTypeId,
        userId,
        archivedAt: null,
      },
      include: {
        dimensions: {
          where: { archivedAt: null },
        },
      },
    });
    if (!activityType) throw new Error("Activity type not found.");

    const dimensionsByKey = new Map<string, {
      id: string;
      key: string;
      label: string;
      kind: string;
    }>(
      activityType.dimensions.map((dimension: any) => [
        String(dimension.key),
        {
          id: String(dimension.id),
          key: String(dimension.key),
          label: String(dimension.label),
          kind: String(dimension.kind),
        },
      ]),
    );

    const dateStr = toDateStrFromLoggedAt(
      input.loggedAtIso,
      input.timezoneOffsetMinutes ?? 0,
    );

    const log = await tx.activityLog.create({
      data: {
        userId,
        activityTypeId: input.activityTypeId,
        loggedAt: new Date(input.loggedAtIso),
        dateStr,
        timezoneOffsetMinutes: input.timezoneOffsetMinutes ?? 0,
      },
    });

    if (input.values.length > 0) {
      await tx.activityLogValue.createMany({
        data: input.values.map((value) => {
          const dimension = dimensionsByKey.get(value.key);
          return {
            logId: log.id,
            dimensionId: dimension?.id ?? null,
            keySnapshot: dimension?.key ?? value.key,
            labelSnapshot: dimension?.label ?? value.label,
            kindSnapshot: dimension?.kind ?? value.kind,
            textValue: value.textValue,
            numberValue: value.numberValue,
            unitValue: value.unitValue,
            dateValue: value.dateValue,
            timeValue: value.timeValue,
            dateTimeValue: value.dateTimeValueIso
              ? new Date(value.dateTimeValueIso)
              : null,
            intValue: value.intValue,
            jsonValue: value.jsonValue,
          };
        }),
      });
    }

    const full = await tx.activityLog.findUniqueOrThrow({
      where: { id: log.id },
      include: {
        activityType: {
          select: { name: true, color: true },
        },
        values: {
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });
    return toActivityLogView(full);
  });
}

export async function listActivityLogs(
  userId: string,
  options?: ListActivityLogsOptions,
): Promise<ActivityLogView[]> {
  assertActivityModelsAvailable();

  const dateFilter: any = {};
  const normalizedStart = options?.startDate
    ? normalizeDateInput(options.startDate).compactDateStr
    : null;
  const normalizedEnd = options?.endDate
    ? normalizeDateInput(options.endDate).compactDateStr
    : null;
  if (normalizedStart) dateFilter.gte = normalizedStart;
  if (normalizedEnd) dateFilter.lte = normalizedEnd;

  const rows = await db.activityLog.findMany({
    where: {
      userId,
      ...(options?.activityTypeId ? { activityTypeId: options.activityTypeId } : {}),
      ...(Object.keys(dateFilter).length ? { dateStr: dateFilter } : {}),
    },
    orderBy: [{ loggedAt: "desc" }],
    include: {
      activityType: {
        select: { name: true, color: true },
      },
      values: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  return rows.map(toActivityLogView);
}

export async function deleteActivityLog(
  userId: string,
  logId: string,
): Promise<void> {
  assertActivityModelsAvailable();

  const existing = await db.activityLog.findFirst({
    where: { id: logId, userId },
    select: { id: true },
  });
  if (!existing) throw new Error("Activity log not found.");

  await db.activityLog.delete({ where: { id: logId } });
}

export async function getActivityContribution(
  userId: string,
  startDate: string,
  endDate: string,
  activityTypeId?: string,
): Promise<ActivityContributionDay[]> {
  "use cache";
  cacheTag(`activitySummary:${userId}`);
  cacheLife("hours");
  if (!hasActivityModels()) return [];

  try {
    const { start, end } = buildDateRangeBounds(startDate, endDate);
    const rows = await db.activityLog.groupBy({
      by: ["dateStr"],
      where: {
        userId,
        dateStr: { gte: start, lte: end },
        ...(activityTypeId ? { activityTypeId } : {}),
      },
      _count: { _all: true },
      orderBy: { dateStr: "asc" },
    });

    return rows.map((row: any) => ({
      dateStr: row.dateStr,
      count: row._count._all,
    }));
  } catch {
    return [];
  }
}

export async function getActivityDateRangeSummary(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ActivityDateRangeSummary[]> {
  if (!hasActivityModels()) return [];

  try {
    const { start, end } = buildDateRangeBounds(startDate, endDate);

    const logs = await db.activityLog.findMany({
      where: {
        userId,
        dateStr: {
          gte: start,
          lte: end,
        },
      },
      orderBy: [{ loggedAt: "asc" }],
      include: {
        activityType: {
          select: { name: true, color: true },
        },
        values: {
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    const byDate = new Map<string, ActivityDaySummaryLog[]>();
    for (const rawLog of logs) {
      const log = toActivityLogView(rawLog);
      const summary = log.values
        .map(summarizeActivityValue)
        .filter((value): value is string => Boolean(value));

      const dayLog: ActivityDaySummaryLog = {
        logId: log.id,
        activityTypeId: log.activityTypeId,
        activityName: log.activityName,
        activityColor: log.activityColor,
        loggedAt: log.loggedAtIso,
        summary,
      };

      const existing = byDate.get(log.dateStr) ?? [];
      existing.push(dayLog);
      byDate.set(log.dateStr, existing);
    }

    return Array.from(byDate.entries()).map(([date, dateLogs]) => ({
      date,
      logs: dateLogs,
    }));
  } catch {
    return [];
  }
}
