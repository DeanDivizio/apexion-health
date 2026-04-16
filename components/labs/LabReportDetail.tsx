"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui_primitives/badge";
import { Button } from "@/components/ui_primitives/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui_primitives/alert-dialog";
import { Input } from "@/components/ui_primitives/input";
import { Skeleton } from "@/components/ui_primitives/skeleton";
import {
  ArrowLeft,
  Download,
  Trash2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  getLabReportAction,
  deleteLabReportAction,
} from "@/actions/labs";
import { decryptFile } from "@/lib/labs/client/fileEncryption";
import type { LabReportDetailView, LabResultView } from "@/lib/labs/types";

interface LabReportDetailProps {
  reportId: string;
  onDeleted: () => void;
  onBack: () => void;
  onSelectMarker: (markerKey: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByPanel(
  results: LabResultView[],
): Map<string, LabResultView[]> {
  const groups = new Map<string, LabResultView[]>();
  const ungrouped: LabResultView[] = [];

  for (const r of results) {
    if (r.panels.length === 0) {
      ungrouped.push(r);
    } else {
      for (const p of r.panels) {
        const list = groups.get(p.displayName) ?? [];
        list.push(r);
        groups.set(p.displayName, list);
      }
    }
  }

  if (ungrouped.length > 0) {
    groups.set("Other", ungrouped);
  }

  return groups;
}

function FlagBadge({ flag }: { flag: string | null }) {
  if (!flag) return null;
  return (
    <Badge
      className={
        flag === "H"
          ? "bg-red-500/20 text-red-400 border-red-500/30"
          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
      }
    >
      {flag === "H" ? "High" : "Low"}
    </Badge>
  );
}

function ResultsTable({
  results,
  onSelectMarker,
}: {
  results: LabResultView[];
  onSelectMarker: (key: string) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/10 text-left text-xs text-white/40">
          <th className="pb-2 pr-4 font-medium">Marker</th>
          <th className="pb-2 pr-4 font-medium text-right">Value</th>
          <th className="pb-2 pr-4 font-medium">Unit</th>
          <th className="pb-2 pr-4 font-medium">Range</th>
          <th className="pb-2 font-medium">Flag</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr
            key={r.id}
            className="border-b border-white/5 hover:bg-white/[0.03]"
          >
            <td className="py-2.5 pr-4">
              <button
                className="text-left text-green-400/80 hover:text-green-400 hover:underline"
                onClick={() => onSelectMarker(r.markerKey)}
              >
                {r.canonicalName}
              </button>
              {r.rawName.toLowerCase() !== r.canonicalName.toLowerCase() && (
                <span className="ml-1.5 text-xs text-white/30">
                  ({r.rawName})
                </span>
              )}
            </td>
            <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-white/90">
              {r.value}
              {r.normalizedValue != null &&
                r.normalizedValue !== r.value && (
                  <span
                    className="ml-1 text-xs text-white/30"
                    title={`Normalized: ${r.normalizedValue.toFixed(2)} ${r.normalizedUnit}`}
                  >
                    *
                  </span>
                )}
            </td>
            <td className="py-2.5 pr-4 text-white/50">{r.unit}</td>
            <td className="py-2.5 pr-4 text-white/40">
              {r.rangeLow != null && r.rangeHigh != null
                ? `${r.rangeLow} – ${r.rangeHigh}`
                : r.rangeLow != null
                  ? `> ${r.rangeLow}`
                  : r.rangeHigh != null
                    ? `< ${r.rangeHigh}`
                    : "—"}
            </td>
            <td className="py-2.5">
              <FlagBadge flag={r.flag} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LabReportDetail({
  reportId,
  onDeleted,
  onBack,
  onSelectMarker,
}: LabReportDetailProps) {
  const [report, setReport] = useState<LabReportDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, startDeleteTransition] = useTransition();
  const [downloadPassword, setDownloadPassword] = useState("");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLabReportAction(reportId).then((data) => {
      setReport(data);
      setLoading(false);
    });
  }, [reportId]);

  const handleDelete = useCallback(() => {
    startDeleteTransition(async () => {
      await deleteLabReportAction(reportId);
      onDeleted();
    });
  }, [reportId, onDeleted]);

  const handleDownload = useCallback(async () => {
    if (!report) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(
        `/api/labs/download?reportId=${reportId}`,
      );
      if (!res.ok) throw new Error("Failed to download file");
      let blob = await res.blob();

      if (report.fileEncrypted) {
        const encrypted = await blob.arrayBuffer();
        const decrypted = await decryptFile(encrypted, downloadPassword);
        blob = new Blob([decrypted], {
          type: report.originalFileName?.endsWith(".pdf")
            ? "application/pdf"
            : "application/octet-stream",
        });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = report.originalFileName ?? "lab-report";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError(
        report.fileEncrypted
          ? "Decryption failed. Check your password."
          : "Download failed.",
      );
    } finally {
      setDownloading(false);
    }
  }, [report, reportId, downloadPassword]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center p-12 text-white/40">
        Report not found.
      </div>
    );
  }

  const panelGroups = groupByPanel(report.results);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-medium text-white/90">
            {formatDate(report.reportDate)}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
            {report.drawTime && <span>Draw: {report.drawTime}</span>}
            {report.institution && <span>{report.institution}</span>}
            {report.providerName && <span>{report.providerName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report.hasFile && (
            <>
              {report.fileEncrypted ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={downloadPassword}
                    onChange={(e) => setDownloadPassword(e.target.value)}
                    className="h-8 w-32 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloading || !downloadPassword}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    {downloading ? "..." : "Download"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  {downloading ? "..." : "Download"}
                </Button>
              )}
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lab Report</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this report and all its results.
                  {report.hasFile &&
                    " The stored original file will also be removed."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {downloadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {downloadError}
        </div>
      )}

      {report.notes && (
        <p className="text-sm italic text-white/40">{report.notes}</p>
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        {Array.from(panelGroups.entries()).map(([panel, results]) => (
          <div key={panel}>
            <h3 className="mb-3 text-sm font-medium text-white/60">
              {panel}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <ResultsTable
                results={results}
                onSelectMarker={onSelectMarker}
              />
            </div>
          </div>
        ))}
      </div>

      {report.results.length === 0 && (
        <div className="py-12 text-center text-white/30">
          No results in this report.
        </div>
      )}
    </div>
  );
}
