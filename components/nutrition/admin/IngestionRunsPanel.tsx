"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, PlayCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { useToast } from "@/hooks/use-toast";
import {
  getMonthlyRetailQueueAction,
  listRetailIngestionRunsAction,
  runMonthlyRetailRefreshAction,
} from "@/actions/nutritionAdmin";

interface QueueEntry {
  chainId: string;
  chainName: string;
  score: number;
  missingSearches: number;
  userAddedItems: number;
  staleDays: number;
  pinned: boolean;
}

interface RunRow {
  runId: string;
  chainId: string;
  status: string;
  chainName: string | null;
  sourceName: string | null;
  sourceType: string | null;
  startedAtIso: string | null;
  finishedAtIso: string | null;
  stagingItemCount: number;
  approvedItemCount: number;
  hardIssueRowCount: number;
  softIssueRowCount: number;
  errorMessage: string | null;
}

function statusTone(status: string): string {
  if (status === "published") return "text-green-400";
  if (status === "publish_ready") return "text-emerald-300";
  if (status === "review_required") return "text-amber-300";
  if (status === "fetch_failed" || status === "needs_source") return "text-red-400";
  return "text-neutral-400";
}

export function IngestionRunsPanel() {
  const { toast } = useToast();
  const [queue, setQueue] = React.useState<QueueEntry[]>([]);
  const [runs, setRuns] = React.useState<RunRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [runningMonthly, setRunningMonthly] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [queueRows, runRows] = await Promise.all([
        getMonthlyRetailQueueAction(25),
        listRetailIngestionRunsAction({ limit: 50 }),
      ]);
      setQueue(queueRows as QueueEntry[]);
      setRuns(runRows as RunRow[]);
    } catch {
      toast({
        title: "Failed to load ingestion dashboard",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRunMonthly() {
    setRunningMonthly(true);
    try {
      const result = await runMonthlyRetailRefreshAction(10);
      toast({
        title: "Monthly refresh started",
        description: `${result.runs.length} chain runs executed`,
      });
      await refresh();
    } catch (error) {
      toast({
        title: "Monthly refresh failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setRunningMonthly(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
        <Button onClick={handleRunMonthly} disabled={runningMonthly}>
          {runningMonthly ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="mr-2 h-4 w-4" />
          )}
          Run monthly refresh (top 10)
        </Button>
      </div>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="border-b border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-300">Monthly queue</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/40 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">Chain</th>
              <th className="px-4 py-2 font-medium">Score</th>
              <th className="px-4 py-2 font-medium">Stale days</th>
              <th className="px-4 py-2 font-medium">User additions</th>
              <th className="px-4 py-2 font-medium">Pinned</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-neutral-500">
                  Loading queue...
                </td>
              </tr>
            ) : queue.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-neutral-500">
                  Queue is empty.
                </td>
              </tr>
            ) : (
              queue.map((entry) => (
                <tr key={entry.chainId} className="border-b border-neutral-800/50 last:border-0">
                  <td className="px-4 py-3 text-neutral-200">{entry.chainName}</td>
                  <td className="px-4 py-3 text-neutral-400">{entry.score}</td>
                  <td className="px-4 py-3 text-neutral-400">{entry.staleDays}</td>
                  <td className="px-4 py-3 text-neutral-400">{entry.userAddedItems}</td>
                  <td className="px-4 py-3 text-neutral-400">{entry.pinned ? "Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="border-b border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-300">Recent ingestion runs</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/40 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">Run</th>
              <th className="px-4 py-2 font-medium">Chain</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Rows</th>
              <th className="px-4 py-2 font-medium">Issues</th>
              <th className="px-4 py-2 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-neutral-500">
                  Loading runs...
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-neutral-500">
                  No runs yet.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.runId} className="border-b border-neutral-800/50 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/nutrition/runs/${run.runId}`}
                      className="text-sky-300 hover:text-sky-200"
                    >
                      {run.runId.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-200">{run.chainName ?? run.chainId}</td>
                  <td className={`px-4 py-3 ${statusTone(run.status)}`}>{run.status}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {run.approvedItemCount}/{run.stagingItemCount}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    hard {run.hardIssueRowCount} • soft {run.softIssueRowCount}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {run.startedAtIso
                      ? new Date(run.startedAtIso).toLocaleString()
                      : "—"}
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
