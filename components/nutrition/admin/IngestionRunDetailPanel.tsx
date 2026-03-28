"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { useToast } from "@/hooks/use-toast";
import {
  getRetailIngestionRunDetailAction,
  listRetailStagingItemsAction,
  publishRetailIngestionRunAction,
  setRetailStagingItemApprovalAction,
  updateRetailStagingItemAction,
} from "@/actions/nutrition";

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
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    [key: string]: number | undefined;
  };
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

export function IngestionRunDetailPanel({ runId }: { runId: string }) {
  const { toast } = useToast();
  const [detail, setDetail] = React.useState<RunDetail | null>(null);
  const [rows, setRows] = React.useState<StagingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingRowId, setSavingRowId] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);

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

  function patchRow(rowId: string, updater: (row: StagingItem) => StagingItem) {
    setRows((prev) => prev.map((row) => (row.id === rowId ? updater(row) : row)));
  }

  async function saveRow(row: StagingItem) {
    setSavingRowId(row.id);
    try {
      const updated = await updateRetailStagingItemAction(row.id, {
        name: row.name,
        category: row.category,
        calories: row.nutrients.calories,
        protein: row.nutrients.protein,
        carbs: row.nutrients.carbs,
        fat: row.nutrients.fat,
      });
      setRows((prev) => prev.map((item) => (item.id === row.id ? (updated as StagingItem) : item)));
      toast({ title: "Row saved" });
      await refresh();
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
      setRows((prev) => prev.map((item) => (item.id === row.id ? (updated as StagingItem) : item)));
      await refresh();
    } catch (error) {
      toast({
        title: "Approval update failed",
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

  const canPublish =
    rows.length > 0 &&
    rows.every((row) => row.reviewed) &&
    rows.some((row) => row.approved) &&
    rows.filter((row) => row.approved).every((row) => row.hardIssueCount === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">Run</p>
          <h1 className="text-xl font-semibold text-neutral-100">{runId}</h1>
          <p className="text-sm text-neutral-400">
            <Link href="/admin/nutrition/runs" className="text-sky-300 hover:text-sky-200">
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
            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publish approved
          </Button>
        </div>
      </div>

      {detail && (
        <div className="grid gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500">Chain</p>
            <p className="text-sm text-neutral-200">{detail.chainName ?? detail.chainId}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Status</p>
            <p className="text-sm text-neutral-200">{detail.status}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Rows</p>
            <p className="text-sm text-neutral-200">
              {detail.approvedItemCount}/{detail.stagingItemCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Issues</p>
            <p className="text-sm text-neutral-200">
              hard {detail.hardIssueRowCount} • soft {detail.softIssueRowCount}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60 text-left text-neutral-500">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium text-right">Cal</th>
              <th className="px-3 py-2 font-medium text-right">Pro</th>
              <th className="px-3 py-2 font-medium text-right">Carb</th>
              <th className="px-3 py-2 font-medium text-right">Fat</th>
              <th className="px-3 py-2 font-medium">Validation</th>
              <th className="px-3 py-2 font-medium">Approval</th>
              <th className="px-3 py-2 font-medium">Save</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-neutral-500">
                  Loading staging rows...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-neutral-500">
                  No staged rows for this run.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-800/50 last:border-0">
                  <td className="px-2 py-2">
                    <Input
                      value={row.name}
                      onChange={(event) =>
                        patchRow(row.id, (current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={row.category ?? ""}
                      onChange={(event) =>
                        patchRow(row.id, (current) => ({
                          ...current,
                          category: event.target.value || null,
                        }))
                      }
                    />
                  </td>
                  {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
                    <td key={key} className="px-2 py-2">
                      <Input
                        type="tel"
                        value={String(row.nutrients[key] ?? 0)}
                        className="text-right"
                        onChange={(event) =>
                          patchRow(row.id, (current) => ({
                            ...current,
                            nutrients: {
                              ...current.nutrients,
                              [key]: Number(event.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {row.hardIssueCount > 0 && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          {row.hardIssueCount} hard
                        </p>
                      )}
                      {row.softIssueCount > 0 && (
                        <p className="flex items-center gap-1 text-xs text-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          {row.softIssueCount} soft
                        </p>
                      )}
                      {row.hardIssueCount === 0 && row.softIssueCount === 0 && (
                        <p className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          clean
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant={row.approved ? "default" : "outline"}
                      disabled={row.hardIssueCount > 0}
                      onClick={() => toggleApproval(row)}
                    >
                      {row.approved ? "Approved" : "Approve"}
                    </Button>
                  </td>
                  <td className="px-3 py-2">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
