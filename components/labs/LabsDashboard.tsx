"use client";

import { useCallback, useState, useTransition } from "react";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { Button } from "@/components/ui_primitives/button";
import { FlaskConical, Plus, TrendingUp, List } from "lucide-react";
import { LabReportCard } from "@/components/labs/LabReportCard";
import { LabReportDetail } from "@/components/labs/LabReportDetail";
import { MarkerTrendChart } from "@/components/labs/MarkerTrendChart";
import { LabReportUploader } from "@/components/labs/LabReportUploader";
import { listLabReportsAction } from "@/actions/labs";
import type { LabReportView } from "@/lib/labs/types";

interface LabsDashboardProps {
  reports: LabReportView[];
}

type MainView =
  | { kind: "empty" }
  | { kind: "report"; reportId: string }
  | { kind: "trends"; markerKey: string }
  | { kind: "upload" };

export function LabsDashboard({ reports: initial }: LabsDashboardProps) {
  const [reports, setReports] = useState(initial);
  const [mainView, setMainView] = useState<MainView>(
    initial.length > 0
      ? { kind: "report", reportId: initial[0].id }
      : { kind: "empty" },
  );
  const [mobileTab, setMobileTab] = useState<"list" | "content">("list");
  const [, startRefresh] = useTransition();

  const refreshReports = useCallback(() => {
    startRefresh(async () => {
      const fresh = await listLabReportsAction();
      setReports(fresh);
    });
  }, []);

  const handleSelectReport = useCallback(
    (id: string) => {
      setMainView({ kind: "report", reportId: id });
      setMobileTab("content");
    },
    [],
  );

  const handleSelectMarker = useCallback((markerKey: string) => {
    setMainView({ kind: "trends", markerKey });
    setMobileTab("content");
  }, []);

  const handleUploadComplete = useCallback(
    (newReportId: string) => {
      refreshReports();
      setMainView({ kind: "report", reportId: newReportId });
      setMobileTab("content");
    },
    [refreshReports],
  );

  const handleDelete = useCallback(() => {
    refreshReports();
    setMainView(reports.length > 1 ? { kind: "report", reportId: reports[0].id } : { kind: "empty" });
    setMobileTab("list");
  }, [refreshReports, reports]);

  const selectedId = mainView.kind === "report" ? mainView.reportId : null;

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
          className={`w-full shrink-0 md:block md:w-80 ${
            mobileTab === "list" ? "block" : "hidden"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/60">Reports</h3>
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

          {reports.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-12 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">No reports yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-2 pr-2">
                {reports.map((r) => (
                  <LabReportCard
                    key={r.id}
                    report={r}
                    isSelected={r.id === selectedId}
                    onSelect={handleSelectReport}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </aside>

        {/* Main content */}
        <main
          className={`min-w-0 flex-1 md:block ${
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

          {mainView.kind === "report" && (
            <LabReportDetail
              reportId={mainView.reportId}
              onDeleted={handleDelete}
              onBack={() => setMobileTab("list")}
              onSelectMarker={handleSelectMarker}
            />
          )}

          {mainView.kind === "trends" && (
            <MarkerTrendChart
              initialMarkerKey={mainView.markerKey}
              onBack={() => {
                if (selectedId) {
                  setMainView({ kind: "report", reportId: selectedId });
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
                const first = reports[0];
                setMainView(
                  first
                    ? { kind: "report", reportId: first.id }
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
