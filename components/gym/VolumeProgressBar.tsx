"use client";

import { cn } from "@/lib/utils";

interface VolumeProgressBarProps {
  label: string;
  current: number;
  record: number;
  className?: string;
}

export function VolumeProgressBar({
  label,
  current,
  record,
  className,
}: VolumeProgressBarProps) {
  const pct = record > 0 ? Math.min((current / record) * 100, 100) : 0;
  const isNewRecord = current > record && record > 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono", isNewRecord ? "text-green-400" : "text-foreground")}>
          {current.toLocaleString()} / {record.toLocaleString()}
          {isNewRecord && " (NEW PR!)"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isNewRecord
              ? "bg-gradient-to-r from-green-500 to-green-300"
              : pct >= 75
                ? "bg-blue-500"
                : "bg-blue-600/70",
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
