"use client";

import { Card } from "@/components/ui_primitives/card";
import { Badge } from "@/components/ui_primitives/badge";
import { FileText, Lock } from "lucide-react";
import type { LabReportView } from "@/lib/labs/types";

interface LabReportCardProps {
  report: LabReportView;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LabReportCard({
  report,
  isSelected,
  onSelect,
}: LabReportCardProps) {
  return (
    <Card
      className={`cursor-pointer p-4 transition-colors ${
        isSelected
          ? "border-green-500/60 bg-green-500/10"
          : "hover:border-white/20 hover:bg-white/[0.04]"
      }`}
      onClick={() => onSelect(report.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/90">
            {formatDate(report.reportDate)}
          </p>
          {report.institution && (
            <p className="mt-0.5 truncate text-xs text-white/50">
              {report.institution}
            </p>
          )}
          {report.providerName && (
            <p className="truncate text-xs text-white/40">
              {report.providerName}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {report.hasFile && (
            <span className="text-white/30">
              {report.fileEncrypted ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Badge variant="secondary" className="text-[11px] font-normal">
          {report.resultCount} marker{report.resultCount !== 1 ? "s" : ""}
        </Badge>
      </div>
    </Card>
  );
}
