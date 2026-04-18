"use server";

import { auth } from "@clerk/nextjs/server";
import { extractLabReport } from "@/lib/labs/ocr/extractLabReport";
import { resolveAliases } from "@/lib/labs/server/aliasResolver";
import { confirmLabReportInputSchema } from "@/lib/labs/schemas";
import {
  createLabReport,
  listLabReports,
  getLabReport,
  listLabReportGroups,
  getLabReportGroup,
  getMarkerHistory,
  deleteLabReport,
  createMarkerAlias,
  listMarkers,
} from "@/lib/labs/server/labService";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

export async function extractLabReportAction(
  fileBase64: string,
  mimeType: string,
) {
  const userId = await requireUserId();

  const dataUrl = fileBase64.startsWith("data:")
    ? fileBase64
    : `data:${mimeType};base64,${fileBase64}`;

  const extraction = await extractLabReport(dataUrl, userId);
  const { matched, unmatched } = await resolveAliases(extraction.results);

  return { extractedReport: extraction, matched, unmatched };
}

export async function confirmLabReportAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = confirmLabReportInputSchema.parse(input);
  const reportId = await createLabReport(userId, parsed);
  return reportId;
}

export async function listLabReportsAction() {
  const userId = await requireUserId();
  return listLabReports(userId);
}

export async function getLabReportAction(reportId: string) {
  const userId = await requireUserId();
  if (!reportId) throw new Error("Report ID is required.");
  return getLabReport(userId, reportId);
}

export async function listLabReportGroupsAction() {
  const userId = await requireUserId();
  return listLabReportGroups(userId);
}

export async function getLabReportGroupAction(reportIds: string[]) {
  const userId = await requireUserId();
  if (!Array.isArray(reportIds) || reportIds.length === 0) {
    throw new Error("At least one report ID is required.");
  }
  return getLabReportGroup(userId, reportIds);
}

export async function getMarkerHistoryAction(markerKey: string) {
  const userId = await requireUserId();
  if (!markerKey) throw new Error("Marker key is required.");
  return getMarkerHistory(userId, markerKey);
}

export async function deleteLabReportAction(reportId: string) {
  const userId = await requireUserId();
  if (!reportId) throw new Error("Report ID is required.");
  await deleteLabReport(userId, reportId);
}

export async function resolveMarkerAliasAction(
  rawName: string,
  markerId: string,
) {
  await requireUserId();
  if (!rawName || !markerId) throw new Error("Raw name and marker ID are required.");
  await createMarkerAlias(markerId, rawName, "manual");
}

export async function listMarkersAction(search?: string) {
  await requireUserId();
  return listMarkers(search ? { search } : undefined);
}
