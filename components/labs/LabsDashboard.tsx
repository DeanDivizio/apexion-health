"use client";

import { useCallback, useState, useTransition } from "react";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { Button } from "@/components/ui_primitives/button";
import { FlaskConical, Plus, TrendingUp, List } from "lucide-react";
import { LabReportCard } from "@/components/labs/LabReportCard";
import { LabReportDetail } from "@/components/labs/LabReportDetail";
import { MarkerTrendChart } from "@/components/labs/MarkerTrendChart";
import { LabReportUploader } from "@/components/labs/LabReportUploader";
import { listLabReportGroupsAction } from "@/actions/labs";
import type { LabReportGroupView } from "@/lib/labs/types";

interface LabsDashboardProps {
  groups: LabReportGroupView[];
}

type MainView =
  | { kind: "empty" }
  | { kind: "group"; groupId: string; reportIds: string[] }
  | { kind: "trends"; markerKey: string }
  | { kind: "upload" };

function findGroupByReportId(
  groups: LabReportGroupView[],
  reportId: string,
): LabReportGroupView | undefined {
  return groups.find((g) => g.reportIds.includes(reportId));
}

export function LabsDashboard({ groups: initial }: LabsDashboardProps) {
  const [groups, setGroups] = useState(initial);
  const [mainView, setMainView] = useState<MainView>(
    initial.length > 0
      ? {
          kind: "group",
          groupId: initial[0].groupId,
          reportIds: initial[0].reportIds,
        }
      : { kind: "empty" },
  );
  const [mobileTab, setMobileTab] = useState<"list" | "content">("list");
  const [, startRefresh] = useTransition();

  const refreshGroups = useCallback(
    (after?: (fresh: LabReportGroupView[]) => void) => {
      startRefresh(async () => {
        const fresh = await listLabReportGroupsAction();
        setGroups(fresh);
        after?.(fresh);
      });
    },
    [],
  );

  const handleSelectGroup = useCallback((group: LabReportGroupView) => {
    setMainView({
      kind: "group",
      groupId: group.groupId,
      reportIds: group.reportIds,
    });
    setMobileTab("content");
  }, []);

  const handleSelectMarker = useCallback((markerKey: string) => {
    setMainView({ kind: "trends", markerKey });
    setMobileTab("content");
  }, []);

  const handleUploadComplete = useCallback(
    (newReportId: string) => {
      refreshGroups((fresh) => {
        const target = findGroupByReportId(fresh, newReportId) ?? fresh[0];
        if (target) {
          setMainView({
            kind: "group",
            groupId: target.groupId,
            reportIds: target.reportIds,
          });
        } else {
          setMainView({ kind: "empty" });
        }
        setMobileTab("content");
      });
    },
    [refreshGroups],
  );

  const handleReportDeleted = useCallback(
    (deletedReportId: string) => {
      refreshGroups((fresh) => {
        setMainView((current) => {
          if (current.kind !== "group") return current;

          if (!current.reportIds.includes(deletedReportId)) return current;

          const remaining = current.reportIds.filter(
            (id) => id !== deletedReportId,
          );

          if (remaining.length === 0) {
            const next = fresh[0];
            return next
              ? {
                  kind: "group",
                  groupId: next.groupId,
                  reportIds: next.reportIds,
                }
              : { kind: "empty" };
          }

          const refreshed =
            fresh.find((g) => g.reportIds.some((id) => remaining.includes(id))) ??
            fresh[0];
          return refreshed
            ? {
                kind: "group",
                groupId: refreshed.groupId,
                reportIds: refreshed.reportIds,
              }
            : { kind: "empty" };
        });
      });
    },
    [refreshGroups],
  );

  const selectedGroupId =
    mainView.kind === "group" ? mainView.groupId : null;

  return (
    <div className="w-full">
      {/* Mobile tabs */}
      <div className="mb-4 flex gap-2 md:hidden">
        <Button
          variant={mobileTab === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMobileTab("list")}
        >
          <List className="mr-1 h-4 w-4" />
          Reports
        </Button>
        <Button
          variant={mobileTab === "content" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMobileTab("content")}
          disabled={mainView.kind === "empty"}
        >
          <TrendingUp className="mr-1 h-4 w-4" />
          Details
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — report list */}
        <aside
          className={`w-full shrink-0 md:block md:min-w-0 md:flex-1 ${
            mobileTab === "list" ? "block" : "hidden"
          }`}
        >
          <div className="mb-3 flex items-center">
            <Button
              size="sm"
              onClick={() => {
                setMainView({ kind: "upload" });
                setMobileTab("content");
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Upload
            </Button>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-12 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">No reports yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-2 pr-2">
                {groups.map((g) => (
                  <LabReportCard
                    key={g.groupId}
                    group={g}
                    isSelected={g.groupId === selectedGroupId}
                    onSelect={handleSelectGroup}
                    onReportDeleted={handleReportDeleted}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </aside>

        {/* Main content */}
        <main
          className={`min-w-0 flex-1 md:block md:w-[45vw] md:flex-none md:shrink-0 ${
            mobileTab === "content" ? "block" : "hidden"
          }`}
        >
          {mainView.kind === "empty" && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] py-24">
              <FlaskConical className="h-12 w-12 text-white/15" />
              <p className="text-white/40">
                Upload your first blood test report to get started.
              </p>
              <Button
                onClick={() => {
                  setMainView({ kind: "upload" });
                  setMobileTab("content");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Report
              </Button>
            </div>
          )}

          {mainView.kind === "group" && (
            <LabReportDetail
              reportIds={mainView.reportIds}
              onBack={() => setMobileTab("list")}
              onSelectMarker={handleSelectMarker}
            />
          )}

          {mainView.kind === "trends" && (
            <MarkerTrendChart
              initialMarkerKey={mainView.markerKey}
              onBack={() => {
                const fallback = groups[0];
                if (fallback) {
                  setMainView({
                    kind: "group",
                    groupId: fallback.groupId,
                    reportIds: fallback.reportIds,
                  });
                } else {
                  setMainView({ kind: "empty" });
                }
              }}
            />
          )}

          {mainView.kind === "upload" && (
            <LabReportUploader
              onComplete={handleUploadComplete}
              onCancel={() => {
                const first = groups[0];
                setMainView(
                  first
                    ? {
                        kind: "group",
                        groupId: first.groupId,
                        reportIds: first.reportIds,
                      }
                    : { kind: "empty" },
                );
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
