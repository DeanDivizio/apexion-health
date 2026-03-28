"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { useToast } from "@/hooks/use-toast";
import {
  deleteRetailStagingItemAction,
  getRetailIngestionRunDetailAction,
  listRetailStagingItemsAction,
  publishRetailIngestionRunAction,
  setRetailStagingItemApprovalAction,
  updateRetailStagingItemAction,
} from "@/actions/nutritionAdmin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RunDetail {
  runId: string;
  chainId: string;
  chainName: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  status: string;
  stagingItemCount: number;
  approvedItemCount: number;
  hardIssueRowCount: number;
  softIssueRowCount: number;
  errorMessage: string | null;
}

interface StagingIssue {
  id: string;
  severity: "hard" | "soft" | "info";
  code: string;
  message: string;
}

interface StagingItem {
  id: string;
  runId: string;
  chainId: string;
  name: string;
  normalizedName: string;
  category: string | null;
  nutrients: Record<string, number | undefined>;
  servingSize: number | null;
  servingUnit: string | null;
  extractionMethod: string;
  confidence: number | null;
  hardIssueCount: number;
  softIssueCount: number;
  reviewed: boolean;
  approved: boolean;
  issues: StagingIssue[];
}

// ---------------------------------------------------------------------------
// Nutrient helpers
// ---------------------------------------------------------------------------

const MACRO_KEYS = ["calories", "protein", "carbs", "fat"] as const;

const NUTRIENT_LABELS: Record<string, string> = {
  calories: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  saturatedFat: "Sat. Fat",
  transFat: "Trans Fat",
  fiber: "Fiber",
  sugars: "Sugars",
  addedSugars: "Added Sugars",
  cholesterol: "Cholesterol",
  sodium: "Sodium",
  calcium: "Calcium",
  iron: "Iron",
  potassium: "Potassium",
  magnesium: "Magnesium",
  vitaminA: "Vitamin A",
  vitaminC: "Vitamin C",
  vitaminD: "Vitamin D",
};

function nutrientLabel(key: string): string {
  if (NUTRIENT_LABELS[key]) return NUTRIENT_LABELS[key];
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function getMicroKeys(nutrients: Record<string, number | undefined>): string[] {
  const macroSet = new Set<string>(MACRO_KEYS);
  return Object.keys(nutrients).filter(
    (k) => !macroSet.has(k) && nutrients[k] !== undefined,
  );
}

const SEVERITY_ORDER: Record<string, number> = { hard: 0, soft: 1, info: 2 };

// ---------------------------------------------------------------------------
// Severity badge
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: "hard" | "soft" | "info" }) {
  const styles = {
    hard: "bg-red-900/50 text-red-300 border-red-800",
    soft: "bg-amber-900/40 text-amber-300 border-amber-800",
    info: "bg-sky-900/40 text-sky-300 border-sky-800",
  };
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Issue badge (summary row)
// ---------------------------------------------------------------------------

function IssueBadges({
  row,
  onClick,
}: {
  row: StagingItem;
  onClick: () => void;
}) {
  if (row.hardIssueCount === 0 && row.softIssueCount === 0) {
    return (
      <p className="flex items-center gap-1 text-xs text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        clean
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-wrap items-center gap-1.5 text-left"
    >
      {row.hardIssueCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <AlertTriangle className="h-3 w-3" />
          {row.hardIssueCount} hard
        </span>
      )}
      {row.softIssueCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-amber-300">
          <AlertTriangle className="h-3 w-3" />
          {row.softIssueCount} soft
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Expanded detail panel
// ---------------------------------------------------------------------------

function RowDetailPanel({
  row,
  onPatchNutrient,
}: {
  row: StagingItem;
  onPatchNutrient: (key: string, value: number) => void;
}) {
  const allKeys = [
    ...MACRO_KEYS,
    ...getMicroKeys(row.nutrients).sort((a, b) =>
      nutrientLabel(a).localeCompare(nutrientLabel(b)),
    ),
  ];

  const sortedIssues = [...row.issues].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
  );

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2">
      {/* Nutrients */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
          All Nutrients
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {allKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <label className="w-20 shrink-0 text-xs text-neutral-400">
                {nutrientLabel(key)}
              </label>
              <Input
                type="tel"
                value={String(row.nutrients[key] ?? 0)}
                className="h-7 w-20 text-right text-xs"
                onChange={(e) => onPatchNutrient(key, Number(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
          Issues ({row.issues.length})
        </h4>
        {row.issues.length === 0 ? (
          <p className="text-xs text-neutral-500">No issues.</p>
        ) : (
          <div className="space-y-2">
            {sortedIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2"
              >
                <div className="mt-0.5 shrink-0">
                  {issue.severity === "hard" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {issue.severity === "soft" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  {issue.severity === "info" && (
                    <Info className="h-3.5 w-3.5 text-sky-400" />
                  )}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <code className="text-[11px] text-neutral-500">
                      {issue.code}
                    </code>
                  </div>
                  <p className="text-xs text-neutral-300">{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const COL_COUNT = 10;

export function IngestionRunDetailPanel({ runId }: { runId: string }) {
  const { toast } = useToast();
  const [detail, setDetail] = React.useState<RunDetail | null>(null);
  const [rows, setRows] = React.useState<StagingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingRowId, setSavingRowId] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [nextDetail, nextRows] = await Promise.all([
        getRetailIngestionRunDetailAction(runId),
        listRetailStagingItemsAction(runId),
      ]);
      setDetail(nextDetail as RunDetail);
      setRows(nextRows as StagingItem[]);
    } catch {
      toast({
        title: "Failed to load run detail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [runId, toast]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function toggleExpanded(rowId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  function patchRow(rowId: string, updater: (row: StagingItem) => StagingItem) {
    setRows((prev) => prev.map((row) => (row.id === rowId ? updater(row) : row)));
  }

  function patchNutrient(rowId: string, key: string, value: number) {
    patchRow(rowId, (current) => ({
      ...current,
      nutrients: { ...current.nutrients, [key]: value },
    }));
  }

  async function saveRow(row: StagingItem) {
    setSavingRowId(row.id);
    try {
      const nutrientPayload: Record<string, number> = {};
      for (const [key, val] of Object.entries(row.nutrients)) {
        if (val !== undefined) nutrientPayload[key] = val;
      }
      const updated = await updateRetailStagingItemAction(row.id, {
        name: row.name,
        category: row.category,
        nutrients: nutrientPayload,
      });
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? (updated as StagingItem) : item)),
      );
      toast({ title: "Row saved" });
    } catch (error) {
      toast({
        title: "Failed to save row",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSavingRowId(null);
    }
  }

  async function toggleApproval(row: StagingItem) {
    try {
      const updated = await setRetailStagingItemApprovalAction(row.id, {
        approved: !row.approved,
      });
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? (updated as StagingItem) : item)),
      );
    } catch (error) {
      toast({
        title: "Approval update failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function deleteRow(rowId: string) {
    try {
      await deleteRetailStagingItemAction(rowId);
      setRows((prev) => prev.filter((item) => item.id !== rowId));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
      toast({ title: "Row removed" });
    } catch (error) {
      toast({
        title: "Failed to remove row",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const result = await publishRetailIngestionRunAction(runId);
      toast({
        title: "Run published",
        description: `${result.publishedCount} items published`,
      });
      await refresh();
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  }

  const approvedCount = rows.filter((r) => r.approved).length;
  const hardIssueRowCount = rows.filter((r) => r.hardIssueCount > 0).length;
  const softIssueRowCount = rows.filter((r) => r.softIssueCount > 0).length;

  const canPublish =
    rows.length > 0 &&
    rows.some((row) => row.approved) &&
    rows.filter((row) => row.approved).every((row) => row.hardIssueCount === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">Run</p>
          <h1 className="text-xl font-semibold text-neutral-100">{runId}</h1>
          <p className="text-sm text-neutral-400">
            <Link
              href="/admin/nutrition/runs"
              className="text-sky-300 hover:text-sky-200"
            >
              Back to runs
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button onClick={publish} disabled={!canPublish || publishing}>
            {publishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Publish approved
          </Button>
        </div>
      </div>

      {/* Run summary card */}
      {detail && (
        <div className="grid gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500">Chain</p>
            <p className="text-sm text-neutral-200">
              {detail.chainName ?? detail.chainId}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Status</p>
            <p className="text-sm text-neutral-200">{detail.status}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Rows</p>
            <p className="text-sm text-neutral-200">
              {approvedCount}/{rows.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Issues</p>
            <p className="text-sm text-neutral-200">
              hard {hardIssueRowCount} &bull; soft {softIssueRowCount}
            </p>
          </div>
        </div>
      )}

      {/* Staging table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-8" />
            <col className="min-w-[280px]" style={{ width: "auto" }} />
            <col style={{ width: "14%" }} />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-16" />
            <col className="w-28" />
            <col className="w-40" />
          </colgroup>
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60 text-left text-neutral-500">
              <th className="px-2 py-2" />
              <th className="px-2 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">Category</th>
              <th className="px-2 py-2 font-medium text-right">Cal</th>
              <th className="px-2 py-2 font-medium text-right">Pro</th>
              <th className="px-2 py-2 font-medium text-right">Carb</th>
              <th className="px-2 py-2 font-medium text-right">Fat</th>
              <th className="px-2 py-2 font-medium text-center">Micros</th>
              <th className="px-2 py-2 font-medium">Issues</th>
              <th className="px-2 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-6 text-neutral-500">
                  Loading staging rows...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-6 text-neutral-500">
                  No staged rows for this run.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const expanded = expandedIds.has(row.id);
                const microCount = getMicroKeys(row.nutrients).length;
                return (
                  <React.Fragment key={row.id}>
                    {/* Summary row */}
                    <tr
                      className={`border-b border-neutral-800/50 transition-colors ${
                        expanded ? "bg-neutral-900/40" : ""
                      }`}
                    >
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(row.id)}
                          className="flex items-center justify-center rounded p-0.5 text-neutral-500 hover:text-neutral-300"
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={row.name}
                          onChange={(e) =>
                            patchRow(row.id, (c) => ({
                              ...c,
                              name: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={row.category ?? ""}
                          onChange={(e) =>
                            patchRow(row.id, (c) => ({
                              ...c,
                              category: e.target.value || null,
                            }))
                          }
                        />
                      </td>
                      {MACRO_KEYS.map((key) => (
                        <td key={key} className="px-2 py-2">
                          <Input
                            type="tel"
                            value={String(row.nutrients[key] ?? 0)}
                            className="text-right"
                            onChange={(e) =>
                              patchNutrient(
                                row.id,
                                key,
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center">
                        {microCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.id)}
                            className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 hover:bg-neutral-700"
                          >
                            {microCount}
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-600">&mdash;</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <IssueBadges
                          row={row}
                          onClick={() => toggleExpanded(row.id)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant={row.approved ? "default" : "outline"}
                            disabled={row.hardIssueCount > 0}
                            onClick={() => toggleApproval(row)}
                          >
                            {row.approved ? "Approved" : "Approve"}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            disabled={savingRowId === row.id}
                            onClick={() => saveRow(row)}
                          >
                            {savingRowId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-red-400 hover:bg-red-950 hover:text-red-300"
                            onClick={() => deleteRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded && (
                      <tr className="border-b border-neutral-800/50 bg-neutral-950/40">
                        <td colSpan={COL_COUNT} className="p-0">
                          <RowDetailPanel
                            row={row}
                            onPatchNutrient={(key, val) =>
                              patchNutrient(row.id, key, val)
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
