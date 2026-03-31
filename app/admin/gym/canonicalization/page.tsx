"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Textarea } from "@/components/ui_primitives/textarea";
import { Label } from "@/components/ui_primitives/label";
import { Badge } from "@/components/ui_primitives/badge";
import { cn } from "@/lib/utils";
import { captureClientEvent } from "@/lib/posthog-client";
import {
  listCanonRequestsAction,
  getCanonRequestDetailAction,
  updateCanonRequestStatusAction,
} from "@/actions/gymAdmin";

type CanonStatus = "new" | "in_review" | "approved" | "rejected";

interface CanonRequestSummary {
  id: string;
  userId: string;
  status: string;
  userNote: string | null;
  adminNote: string | null;
  createdAt: string;
  customExercise: {
    id: string;
    key: string;
    name: string;
    category: string;
    presetId: string | null;
    movementPattern: string | null;
    bodyRegion: string | null;
  };
}

interface CanonRequestDetail extends CanonRequestSummary {
  snapshotPayload: Record<string, unknown>;
  customExercise: CanonRequestSummary["customExercise"] & {
    targets: Array<{ muscle: string; weight: number }>;
    variationSupports: Array<{
      templateId: string;
      labelOverride: string | null;
      defaultOptionKey: string | null;
    }>;
    optionOverrides: Array<{
      templateId: string;
      optionKey: string;
      labelOverride: string;
    }>;
    effects: Array<{
      templateId: string;
      optionKey: string;
      multipliers: unknown;
      deltas: unknown;
    }>;
  };
}

const STATUS_CONFIG: Record<CanonStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Clock className="h-3 w-3" /> },
  in_review: { label: "In Review", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <Eye className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
};

const CATEGORY_LABELS: Record<string, string> = {
  upperBody: "Upper Body",
  lowerBody: "Lower Body",
  core: "Core",
  cardio: "Cardio",
};

export default function CanonRequestsPage() {
  const [requests, setRequests] = useState<CanonRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CanonStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CanonRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCanonRequestsAction(
        statusFilter !== "all" ? { status: statusFilter } : undefined,
      );
      setRequests(data as unknown as CanonRequestSummary[]);
    } catch (err) {
      console.error("Failed to load canon requests:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
    captureClientEvent("gym_canonicalization_queue_viewed", { status_filter: statusFilter });
  }, [loadRequests, statusFilter]);

  const loadDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await getCanonRequestDetailAction(id);
      const d = data as unknown as CanonRequestDetail;
      setDetail(d);
      setAdminNote(d.adminNote ?? "");
    } catch (err) {
      console.error("Failed to load canon request detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleStatusUpdate = useCallback(
    async (newStatus: CanonStatus) => {
      if (!selectedId) return;
      setUpdating(true);
      try {
        await updateCanonRequestStatusAction({
          id: selectedId,
          status: newStatus,
          adminNote: adminNote.trim() || undefined,
        });
        await loadDetail(selectedId);
        await loadRequests();
      } catch (err) {
        console.error("Failed to update status:", err);
      } finally {
        setUpdating(false);
      }
    },
    [selectedId, adminNote, loadDetail, loadRequests],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">
          Canonicalization Requests
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Review user-submitted custom exercises for promotion to the built-in library.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-neutral-500" />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as CanonStatus | "all")}
        >
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_CONFIG) as CanonStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* Queue List */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Search className="h-6 w-6 mb-2" />
              <p className="text-sm">No requests found.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {requests.map((req) => {
                const cfg = STATUS_CONFIG[req.status as CanonStatus] ?? STATUS_CONFIG.new;
                const isActive = selectedId === req.id;
                return (
                  <button
                    key={req.id}
                    onClick={() => loadDetail(req.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors hover:bg-neutral-800/40",
                      isActive && "bg-neutral-800/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-200 truncate">
                          {req.customExercise.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-[10px] gap-1 px-1.5 py-0", cfg.color)}>
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                          <span className="text-[11px] text-neutral-500">
                            {CATEGORY_LABELS[req.customExercise.category] ?? req.customExercise.category}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-600 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          {!selectedId ? (
            <div className="flex items-center justify-center h-48 text-neutral-500 text-sm">
              Select a request to view details.
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-neutral-100">
                  {detail.customExercise.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs gap-1",
                      STATUS_CONFIG[detail.status as CanonStatus]?.color,
                    )}
                  >
                    {STATUS_CONFIG[detail.status as CanonStatus]?.icon}
                    {STATUS_CONFIG[detail.status as CanonStatus]?.label}
                  </Badge>
                  <span className="text-xs text-neutral-500">
                    Submitted {new Date(detail.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Exercise Info */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3 space-y-2 text-sm">
                <Row label="Key" value={detail.customExercise.key} />
                <Row label="Category" value={CATEGORY_LABELS[detail.customExercise.category] ?? detail.customExercise.category} />
                <Row label="Preset" value={detail.customExercise.presetId ?? "—"} />
                <Row label="Pattern" value={detail.customExercise.movementPattern ?? "—"} />
                <Row label="Region" value={detail.customExercise.bodyRegion ?? "—"} />
              </div>

              {/* Muscle Targets */}
              {detail.customExercise.targets.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-neutral-400">Muscle Targets</h3>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3 space-y-1.5">
                    {detail.customExercise.targets
                      .sort((a, b) => b.weight - a.weight)
                      .map((t) => (
                        <div key={t.muscle} className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.round(t.weight * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-400 w-24 text-right truncate">
                            {t.muscle.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                          </span>
                          <span className="text-xs font-mono text-neutral-500 w-8 text-right">
                            {Math.round(t.weight * 100)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Variations */}
              {detail.customExercise.variationSupports.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-neutral-400">Variation Supports</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.customExercise.variationSupports.map((v) => (
                      <Badge key={v.templateId} variant="secondary" className="text-xs">
                        {v.templateId}
                        {v.defaultOptionKey && (
                          <span className="text-neutral-500 ml-1">({v.defaultOptionKey})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* User Note */}
              {detail.userNote && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-medium text-neutral-400">User Note</h3>
                  <p className="text-sm text-neutral-300 bg-neutral-950/40 rounded-lg border border-neutral-800 p-3">
                    {detail.userNote}
                  </p>
                </div>
              )}

              {/* Snapshot */}
              <details className="group">
                <summary className="text-xs font-medium text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors">
                  Raw snapshot payload
                </summary>
                <pre className="mt-2 text-xs text-neutral-500 bg-neutral-950/40 rounded-lg border border-neutral-800 p-3 overflow-x-auto max-h-48">
                  {JSON.stringify(detail.snapshotPayload, null, 2)}
                </pre>
              </details>

              {/* Admin Actions */}
              <div className="border-t border-neutral-800 pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Admin Note</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="EMG references, notes on muscle activation patterns..."
                    rows={3}
                    maxLength={2000}
                    className="text-sm resize-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {detail.status !== "in_review" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => handleStatusUpdate("in_review")}
                      disabled={updating}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      {updating ? "..." : "Mark In Review"}
                    </Button>
                  )}
                  {detail.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/40 text-green-400 hover:bg-green-500/10"
                      onClick={() => handleStatusUpdate("approved")}
                      disabled={updating}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      {updating ? "..." : "Approve"}
                    </Button>
                  )}
                  {detail.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleStatusUpdate("rejected")}
                      disabled={updating}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      {updating ? "..." : "Reject"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-300 font-mono text-xs">{value}</span>
    </div>
  );
}
