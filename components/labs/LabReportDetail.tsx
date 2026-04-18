"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui_primitives/badge";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Skeleton } from "@/components/ui_primitives/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu";
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  ChevronDown,
  Lock,
} from "lucide-react";
import { getLabReportGroupAction } from "@/actions/labs";
import { decryptFile } from "@/lib/labs/client/fileEncryption";
import type {
  LabReportGroupDetailView,
  LabResultView,
  LabReportSourceView,
} from "@/lib/labs/types";

interface LabReportDetailProps {
  reportIds: string[];
  onBack: () => void;
  onSelectMarker: (markerKey: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
  sourceIndexById,
  showSource,
}: {
  results: LabResultView[];
  onSelectMarker: (key: string) => void;
  sourceIndexById: Map<string, number>;
  showSource: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/10 text-left text-xs text-white/40">
          <th className="pb-2 pr-4 font-medium">Marker</th>
          <th className="pb-2 pr-4 font-medium text-right">Value</th>
          <th className="pb-2 pr-4 font-medium whitespace-nowrap w-px">Unit</th>
          <th className="pb-2 pr-4 font-medium">Range</th>
          <th className="pb-2 font-medium">Flag</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => {
          const sourceIdx = sourceIndexById.get(r.sourceReportId);
          return (
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
                {showSource && sourceIdx != null && (
                  <span
                    className="ml-1.5 text-[10px] text-white/30"
                    title={`From upload #${sourceIdx + 1}`}
                  >
                    #{sourceIdx + 1}
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
              <td className="py-2.5 pr-4 text-white/50 whitespace-nowrap">
                {r.unit}
              </td>
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
          );
        })}
      </tbody>
    </table>
  );
}

function DownloadControl({
  sources,
  onDownload,
  downloading,
  activeSourceId,
  passwordBySourceId,
  setPassword,
}: {
  sources: LabReportSourceView[];
  onDownload: (source: LabReportSourceView) => void;
  downloading: boolean;
  activeSourceId: string | null;
  passwordBySourceId: Record<string, string>;
  setPassword: (sourceId: string, value: string) => void;
}) {
  const filesWithData = sources.filter((s) => s.hasFile);
  if (filesWithData.length === 0) return null;

  if (filesWithData.length === 1) {
    const source = filesWithData[0];
    if (source.fileEncrypted) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="password"
            placeholder="Password"
            value={passwordBySourceId[source.id] ?? ""}
            onChange={(e) => setPassword(source.id, e.target.value)}
            className="h-8 w-32 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(source)}
            disabled={
              downloading || !(passwordBySourceId[source.id] ?? "").length
            }
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            {downloading ? "..." : "Download"}
          </Button>
        </div>
      );
    }
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDownload(source)}
        disabled={downloading}
      >
        <Download className="mr-1 h-3.5 w-3.5" />
        {downloading ? "..." : "Download"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={downloading}>
          <Download className="mr-1 h-3.5 w-3.5" />
          {downloading ? "..." : "Download"}
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {filesWithData.map((source, idx) => (
          <DownloadMenuItem
            key={source.id}
            source={source}
            index={idx}
            password={passwordBySourceId[source.id] ?? ""}
            onPasswordChange={(v) => setPassword(source.id, v)}
            onDownload={() => onDownload(source)}
            downloading={downloading && activeSourceId === source.id}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DownloadMenuItem({
  source,
  index,
  password,
  onPasswordChange,
  onDownload,
  downloading,
}: {
  source: LabReportSourceView;
  index: number;
  password: string;
  onPasswordChange: (value: string) => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  if (source.fileEncrypted) {
    return (
      <div className="space-y-1 px-2 py-1.5">
        <p className="truncate text-xs text-white/70">
          <Lock className="mr-1 inline h-3 w-3" />
          {source.originalFileName ?? `Upload #${index + 1}`}
        </p>
        <p className="text-[10px] text-white/30">
          {formatUploadedAt(source.createdAt)}
        </p>
        <div className="flex items-center gap-1.5">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="h-7 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            disabled={downloading || !password.length}
            className="shrink-0"
          >
            {downloading ? "..." : "Go"}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        onDownload();
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-white/80">
          {source.originalFileName ?? `Upload #${index + 1}`}
        </p>
        <p className="text-[10px] text-white/30">
          {formatUploadedAt(source.createdAt)}
        </p>
      </div>
      <Download className="ml-2 h-3.5 w-3.5 text-white/50" />
    </DropdownMenuItem>
  );
}

export function LabReportDetail({
  reportIds,
  onBack,
  onSelectMarker,
}: LabReportDetailProps) {
  const [group, setGroup] = useState<LabReportGroupDetailView | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [passwordBySourceId, setPasswordBySourceId] = useState<
    Record<string, string>
  >({});
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);

  const reportIdsKey = useMemo(() => reportIds.join("|"), [reportIds]);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);
    setDownloadError(null);
    getLabReportGroupAction(reportIds).then((data) => {
      if (cancelled) return;
      setGroup(data);
      setIsFetching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reportIdsKey, reportIds]);

  const handleDownload = useCallback(
    async (source: LabReportSourceView) => {
      setDownloading(true);
      setActiveDownloadId(source.id);
      setDownloadError(null);
      try {
        const res = await fetch(
          `/api/labs/download?reportId=${source.id}`,
        );
        if (!res.ok) throw new Error("Failed to download file");
        let blob = await res.blob();

        if (source.fileEncrypted) {
          const password = passwordBySourceId[source.id] ?? "";
          const encrypted = await blob.arrayBuffer();
          const decrypted = await decryptFile(encrypted, password);
          blob = new Blob([decrypted], {
            type: source.originalFileName?.endsWith(".pdf")
              ? "application/pdf"
              : "application/octet-stream",
          });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = source.originalFileName ?? "lab-report";
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        setDownloadError(
          source.fileEncrypted
            ? "Decryption failed. Check your password."
            : "Download failed.",
        );
      } finally {
        setDownloading(false);
        setActiveDownloadId(null);
      }
    },
    [passwordBySourceId],
  );

  const setPassword = useCallback((sourceId: string, value: string) => {
    setPasswordBySourceId((prev) => ({ ...prev, [sourceId]: value }));
  }, []);

  const sourceIndexById = useMemo(() => {
    const map = new Map<string, number>();
    group?.sources.forEach((s, idx) => map.set(s.id, idx));
    return map;
  }, [group]);

  if (isFetching && !group) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center p-12 text-white/40">
        Report not found.
      </div>
    );
  }

  const panelGroups = groupByPanel(group.results);
  const showSource = group.sources.length > 1;

  return (
    <div
      className={`space-y-6 transition-opacity duration-150 ${
        isFetching ? "opacity-60" : "opacity-100"
      }`}
    >
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
            {formatDate(group.reportDate)}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
            {group.drawTime && <span>Draw: {group.drawTime}</span>}
            {group.institution && <span>{group.institution}</span>}
            {group.providerName && <span>{group.providerName}</span>}
            {showSource && (
              <span className="text-white/30">
                {group.sources.length} uploads
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DownloadControl
            sources={group.sources}
            onDownload={handleDownload}
            downloading={downloading}
            activeSourceId={activeDownloadId}
            passwordBySourceId={passwordBySourceId}
            setPassword={setPassword}
          />
        </div>
      </div>

      {downloadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {downloadError}
        </div>
      )}

      {group.notes.length > 0 && (
        <div className="space-y-1">
          {group.notes.map((note, idx) => (
            <p key={idx} className="text-sm italic text-white/40">
              {note}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {Array.from(panelGroups.entries()).map(([panel, results]) => (
          <div key={panel}>
            <h3 className="mb-3 text-sm font-medium text-white/60">{panel}</h3>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <ResultsTable
                results={results}
                onSelectMarker={onSelectMarker}
                sourceIndexById={sourceIndexById}
                showSource={showSource}
              />
            </div>
          </div>
        ))}
      </div>

      {group.results.length === 0 && (
        <div className="py-12 text-center text-white/30">
          No results in this report.
        </div>
      )}
    </div>
  );
}
