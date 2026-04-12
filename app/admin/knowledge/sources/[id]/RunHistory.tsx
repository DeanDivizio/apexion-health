"use client";

import { useState } from "react";

interface Run {
  id: string;
  step: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  stats: unknown;
  error: string | null;
}

export function RunHistory({ runs }: { runs: Run[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (runs.length === 0) {
    return (
      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">
          Ingestion Runs
        </h2>
        <p className="py-4 text-center text-sm text-neutral-500">
          No runs yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-neutral-300">
        Ingestion Runs ({runs.length})
      </h2>
      <div className="space-y-1">
        {runs.map((run) => {
          const stats = (run.stats ?? {}) as Record<string, unknown>;
          const duration =
            run.completedAt && run.startedAt
              ? Math.round(
                  (new Date(run.completedAt).getTime() -
                    new Date(run.startedAt).getTime()) /
                    1000,
                )
              : null;
          const hasStats = Object.keys(stats).length > 0;
          const isExpanded = expandedId === run.id;

          return (
            <div
              key={run.id}
              className="rounded-lg border border-neutral-800 bg-neutral-900/50"
            >
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : run.id)
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
              >
                <span className="text-xs font-medium text-neutral-300">
                  {run.step}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    run.status === "COMPLETED"
                      ? "bg-emerald-950 text-emerald-400"
                      : run.status === "FAILED"
                        ? "bg-red-950 text-red-400"
                        : run.status === "RUNNING"
                          ? "bg-blue-950 text-blue-400"
                          : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {run.status}
                </span>
                {duration !== null && (
                  <span className="text-[10px] text-neutral-500">
                    {duration}s
                  </span>
                )}
                {typeof stats.estimatedCostUsd === "number" && (
                  <span className="text-[10px] text-amber-400">
                    ${(stats.estimatedCostUsd as number).toFixed(4)}
                  </span>
                )}
                <span className="ml-auto text-[10px] text-neutral-600">
                  {new Date(run.startedAt).toLocaleString()}
                </span>
                {hasStats && (
                  <span className="text-[10px] text-neutral-600">
                    {isExpanded ? "▾" : "▸"}
                  </span>
                )}
              </button>

              {isExpanded && hasStats && (
                <div className="border-t border-neutral-800 px-4 py-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] sm:grid-cols-3">
                    {Object.entries(stats).map(([key, value]) => {
                      if (
                        typeof value === "object" &&
                        value !== null
                      ) {
                        return (
                          <div key={key} className="col-span-full mt-1">
                            <span className="text-neutral-500">
                              {formatStatKey(key)}:
                            </span>
                            <div className="mt-0.5 flex flex-wrap gap-1.5">
                              {Object.entries(
                                value as Record<string, unknown>,
                              ).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-neutral-400"
                                >
                                  {k}: {formatStatValue(v)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={key}>
                          <span className="text-neutral-500">
                            {formatStatKey(key)}:
                          </span>{" "}
                          <span className="text-neutral-300">
                            {formatStatValue(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {run.error && (
                    <p className="mt-2 text-[11px] text-red-400">
                      {run.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatStatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatStatValue(value: unknown): string {
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(4);
  }
  return String(value);
}
