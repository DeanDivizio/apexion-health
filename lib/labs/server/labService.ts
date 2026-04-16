import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { cacheTag, cacheLife } from "next/cache";
import { updateTag } from "next/cache";
import type { ConfirmLabReportInput } from "@/lib/labs/schemas";
import type {
  LabReportView,
  LabReportDetailView,
  LabResultView,
  MarkerHistoryPoint,
  MarkerCatalogView,
} from "@/lib/labs/types";
import {
  uploadLabReportFile,
  deleteLabReportFile,
} from "@/lib/labs/server/labReportStorage";

type ReportWithCount = Prisma.LabReportGetPayload<{
  include: { _count: { select: { results: true } } };
}>;

const resultInclude = {
  marker: {
    include: {
      panelLinks: {
        include: {
          panel: { select: { id: true, key: true, displayName: true } },
        },
      },
    },
  },
} satisfies Prisma.LabResultInclude;

type ResultWithMarkerAndPanels = Prisma.LabResultGetPayload<{
  include: typeof resultInclude;
}>;

type ReportWithResults = Prisma.LabReportGetPayload<{
  include: { results: { include: typeof resultInclude } };
}>;

function normalizeAliasName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function toReportView(row: ReportWithCount): LabReportView {
  return {
    id: row.id,
    reportDate: row.reportDate.toISOString(),
    drawTime: row.drawTime ?? null,
    institution: row.institution ?? null,
    providerName: row.providerName ?? null,
    notes: row.notes ?? null,
    resultCount: row._count?.results ?? 0,
    hasFile: !!row.originalFileUrl,
    fileEncrypted: row.fileEncrypted,
    createdAt: row.createdAt.toISOString(),
  };
}

function toResultView(row: ResultWithMarkerAndPanels): LabResultView {
  return {
    id: row.id,
    markerId: row.markerId,
    markerKey: row.marker.key,
    canonicalName: row.marker.canonicalName,
    value: row.value,
    unit: row.unit,
    normalizedValue: row.normalizedValue,
    normalizedUnit: row.normalizedUnit,
    rangeLow: row.rangeLow,
    rangeHigh: row.rangeHigh,
    flag: row.flag,
    rawName: row.rawName,
    panels: row.marker.panelLinks.map((pl) => ({
      id: pl.panel.id,
      key: pl.panel.key,
      displayName: pl.panel.displayName,
    })),
  };
}

function toDetailView(row: ReportWithResults): LabReportDetailView {
  return {
    id: row.id,
    reportDate: row.reportDate.toISOString(),
    drawTime: row.drawTime ?? null,
    institution: row.institution ?? null,
    providerName: row.providerName ?? null,
    notes: row.notes ?? null,
    hasFile: !!row.originalFileUrl,
    fileEncrypted: row.fileEncrypted,
    originalFileName: row.originalFileName ?? null,
    createdAt: row.createdAt.toISOString(),
    results: (row.results ?? []).map(toResultView),
  };
}

export async function normalizeResultValue(
  markerId: string,
  value: number,
  unit: string,
): Promise<{ normalizedValue: number; normalizedUnit: string } | null> {
  const marker = await prisma.labMarker.findUnique({
    where: { id: markerId },
    select: { unit: true },
  });
  if (!marker || marker.unit === unit) return null;

  const conversion = await prisma.labUnitConversion.findUnique({
    where: {
      markerId_fromUnit_toUnit: { markerId, fromUnit: unit, toUnit: marker.unit },
    },
  });
  if (!conversion) return null;

  return {
    normalizedValue: value * conversion.factor,
    normalizedUnit: conversion.toUnit,
  };
}

export async function createLabReport(
  userId: string,
  input: ConfirmLabReportInput,
): Promise<string> {
  const reportId = await prisma.$transaction(async (tx) => {
    const report = await tx.labReport.create({
      data: {
        userId,
        reportDate: new Date(input.reportDate),
        drawTime: input.drawTime ?? null,
        institution: input.institution ?? null,
        providerName: input.providerName ?? null,
        notes: input.notes ?? null,
      },
    });

    for (const result of input.results) {
      const marker = await tx.labMarker.findUnique({
        where: { id: result.markerId },
        select: { unit: true },
      });

      let normalizedValue: number | null = null;
      let normalizedUnit: string | null = null;

      if (marker && marker.unit !== result.unit) {
        const conversion = await tx.labUnitConversion.findUnique({
          where: {
            markerId_fromUnit_toUnit: {
              markerId: result.markerId,
              fromUnit: result.unit,
              toUnit: marker.unit,
            },
          },
        });
        if (conversion) {
          normalizedValue = result.value * conversion.factor;
          normalizedUnit = conversion.toUnit;
        }
      }

      await tx.labResult.create({
        data: {
          reportId: report.id,
          markerId: result.markerId,
          value: result.value,
          unit: result.unit,
          normalizedValue,
          normalizedUnit,
          rangeLow: result.rangeLow ?? null,
          rangeHigh: result.rangeHigh ?? null,
          flag: result.flag ?? null,
          rawName: result.rawName,
        },
      });
    }

    if (input.newAliases?.length) {
      for (const alias of input.newAliases) {
        const normalized = normalizeAliasName(alias.rawName);
        await tx.labMarkerAlias.upsert({
          where: { alias: normalized },
          update: { markerId: alias.markerId, source: "manual" },
          create: {
            markerId: alias.markerId,
            alias: normalized,
            source: "manual",
          },
        });
      }
    }

    return report.id;
  });

  if (input.file) {
    try {
      const fileBytes = Uint8Array.from(atob(input.file.base64), (c) =>
        c.charCodeAt(0),
      );
      const storagePath = await uploadLabReportFile({
        userId,
        reportId,
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        body: fileBytes,
      });

      await prisma.labReport.update({
        where: { id: reportId },
        data: {
          originalFileUrl: storagePath,
          originalFileName: input.file.fileName,
          originalFileMimeType: input.file.mimeType,
          fileEncrypted: input.file.encrypted,
        },
      });
    } catch (err) {
      console.error("Failed to upload lab report file, report saved without file:", err);
    }
  }

  updateTag(`labs-${userId}`);
  return reportId;
}

export async function listLabReports(
  userId: string,
  opts?: { limit?: number; offset?: number },
): Promise<LabReportView[]> {
  "use cache";
  cacheTag(`labs-${userId}`);
  cacheLife("hours");

  const reports = await prisma.labReport.findMany({
    where: { userId },
    orderBy: { reportDate: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
    include: { _count: { select: { results: true } } },
  });

  return reports.map(toReportView);
}

export async function getLabReport(
  userId: string,
  reportId: string,
): Promise<LabReportDetailView | null> {
  "use cache";
  cacheTag(`labs-${userId}`);
  cacheLife("hours");

  const report = await prisma.labReport.findFirst({
    where: { id: reportId, userId },
    include: {
      results: {
        include: resultInclude,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!report) return null;
  return toDetailView(report);
}

export async function getMarkerHistory(
  userId: string,
  markerKey: string,
): Promise<MarkerHistoryPoint[]> {
  "use cache";
  cacheTag(`labs-${userId}`, `lab-marker-${userId}-${markerKey}`);
  cacheLife("hours");

  const results = await prisma.labResult.findMany({
    where: {
      marker: { key: markerKey },
      report: { userId },
    },
    include: {
      report: {
        select: {
          reportDate: true,
          drawTime: true,
          institution: true,
        },
      },
    },
    orderBy: { report: { reportDate: "asc" } },
  });

  return results.map((r) => ({
    reportDate: r.report.reportDate.toISOString(),
    drawTime: r.report.drawTime ?? null,
    value: r.value,
    unit: r.unit,
    normalizedValue: r.normalizedValue,
    normalizedUnit: r.normalizedUnit,
    rangeLow: r.rangeLow,
    rangeHigh: r.rangeHigh,
    flag: r.flag,
    institution: r.report.institution ?? null,
  }));
}

export async function listMarkers(opts?: {
  search?: string;
}): Promise<MarkerCatalogView[]> {
  "use cache";
  cacheTag("lab-markers");
  cacheLife("days");

  const markers = await prisma.labMarker.findMany({
    where: {
      active: true,
      ...(opts?.search
        ? { canonicalName: { contains: opts.search, mode: "insensitive" } }
        : {}),
    },
    include: {
      panelLinks: {
        include: {
          panel: { select: { id: true, key: true, displayName: true } },
        },
      },
    },
    orderBy: { canonicalName: "asc" },
  });

  return markers.map((m) => ({
    id: m.id,
    key: m.key,
    canonicalName: m.canonicalName,
    unit: m.unit,
    defaultRangeLow: m.defaultRangeLow,
    defaultRangeHigh: m.defaultRangeHigh,
    panels: m.panelLinks.map((pl) => ({
      id: pl.panel.id,
      key: pl.panel.key,
      displayName: pl.panel.displayName,
    })),
  }));
}

export async function createMarkerAlias(
  markerId: string,
  alias: string,
  source: "seed" | "ocr" | "manual",
): Promise<void> {
  const normalized = normalizeAliasName(alias);
  await prisma.labMarkerAlias.upsert({
    where: { alias: normalized },
    update: { markerId, source },
    create: { markerId, alias: normalized, source },
  });
}

export async function deleteLabReport(
  userId: string,
  reportId: string,
): Promise<void> {
  const report = await prisma.labReport.findFirst({
    where: { id: reportId, userId },
    select: {
      id: true,
      originalFileUrl: true,
      originalFileName: true,
    },
  });

  if (!report) throw new Error("Lab report not found.");

  if (report.originalFileUrl && report.originalFileName) {
    await deleteLabReportFile(userId, reportId, report.originalFileName);
  }

  await prisma.labReport.delete({ where: { id: reportId } });
  updateTag(`labs-${userId}`);
}
