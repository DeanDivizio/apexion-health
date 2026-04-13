"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui_primitives/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  archiveActivityTypeAction,
  createActivityTypeAction,
  getActivityContributionAction,
  listActivityLogsAction,
  listActivityTypesAction,
  replaceActivityDimensionsAction,
  updateActivityTypeAction,
} from "@/actions/activity";
import {
  getUserHomePreferencesAction,
  toggleActivityCalendarPinAction,
  toggleActivityTypePinAction,
} from "@/actions/settings";
import type {
  ActivityContributionDay,
  ActivityLogView,
  ActivityTypeView,
} from "@/lib/activity";
import { computeStreaks } from "@/lib/activity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_primitives/tabs";
import { ActivityTypeForm } from "./ActivityTypeForm";
import { ActivityLogsList } from "./ActivityLogsList";
import { ActivityContributionGrid } from "./ActivityContributionGrid";
import { ActivityTrackerStrip } from "./ActivityTrackerStrip";
import { ACTIVITY_ICON_MAP } from "./activityIconMap";

const FALLBACK_COLOR = "#10b981";

function getMonthRange(date: Date = new Date()): { startDate: string; endDate: string } {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(first), endDate: fmt(last) };
}

interface ActivityCollectionProps {
  initialTypes: ActivityTypeView[];
  initialLogs: ActivityLogView[];
  initialContributions: ActivityContributionDay[];
}

export function ActivityCollection({
  initialTypes,
  initialLogs,
  initialContributions,
}: ActivityCollectionProps) {
  const { toast } = useToast();
  const [types, setTypes] = React.useState<ActivityTypeView[]>(initialTypes);
  const [logs, setLogs] = React.useState<ActivityLogView[]>(initialLogs);
  const [contributions, setContributions] = React.useState<ActivityContributionDay[]>(initialContributions);
  const [editing, setEditing] = React.useState<ActivityTypeView | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [savingType, setSavingType] = React.useState(false);
  const [archiveTarget, setArchiveTarget] = React.useState<ActivityTypeView | null>(null);
  const [selectedDateStr, setSelectedDateStr] = React.useState<string | null>(null);
  const [monthDate, setMonthDate] = React.useState(() => new Date());
  const [calendarPinned, setCalendarPinned] = React.useState(false);
  const [pinnedTypeIds, setPinnedTypeIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => { setTypes(initialTypes); }, [initialTypes]);
  React.useEffect(() => { setLogs(initialLogs); }, [initialLogs]);
  React.useEffect(() => { setContributions(initialContributions); }, [initialContributions]);

  React.useEffect(() => {
    getUserHomePreferencesAction().then((prefs) => {
      setCalendarPinned(prefs.showActivityCalendar);
      setPinnedTypeIds(new Set(prefs.pinnedActivityTypeIds));
    });
  }, []);

  const { currentStreak, bestStreak } = React.useMemo(
    () => computeStreaks(contributions),
    [contributions],
  );

  const refreshContributions = React.useCallback(async (date: Date) => {
    const { startDate, endDate } = getMonthRange(date);
    const nextContribs = await getActivityContributionAction(startDate, endDate);
    setContributions(nextContribs);
  }, []);

  const refresh = React.useCallback(async () => {
    const { startDate, endDate } = getMonthRange(monthDate);
    const [nextTypes, nextLogs, nextContribs] = await Promise.all([
      listActivityTypesAction(),
      listActivityLogsAction(),
      getActivityContributionAction(startDate, endDate),
    ]);
    setTypes(nextTypes);
    setLogs(nextLogs);
    setContributions(nextContribs);
  }, [monthDate]);

  const handleMonthChange = React.useCallback((newMonth: Date) => {
    setMonthDate(newMonth);
    setSelectedDateStr(null);
    refreshContributions(newMonth);
  }, [refreshContributions]);

  const handleToggleCalendarPin = React.useCallback(async (pinned: boolean) => {
    setCalendarPinned(pinned);
    try {
      await toggleActivityCalendarPinAction(pinned);
      toast({ title: pinned ? "Calendar pinned to Home" : "Calendar unpinned from Home" });
    } catch {
      setCalendarPinned(!pinned);
      toast({ title: "Failed to update pin", variant: "destructive" });
    }
  }, [toast]);

  const handleToggleTypePin = React.useCallback(async (typeId: string, pinned: boolean) => {
    setPinnedTypeIds((prev) => {
      const next = new Set(prev);
      if (pinned) next.add(typeId);
      else next.delete(typeId);
      return next;
    });
    try {
      await toggleActivityTypePinAction(typeId, pinned);
      toast({ title: pinned ? "Activity pinned to Home" : "Activity unpinned from Home" });
    } catch {
      setPinnedTypeIds((prev) => {
        const next = new Set(prev);
        if (pinned) next.delete(typeId);
        else next.add(typeId);
        return next;
      });
      toast({ title: "Failed to update pin", variant: "destructive" });
    }
  }, [toast]);

  const handleSaveType = async (payload: {
    name: string;
    color: string | null;
    icon: string | null;
    dimensions: Array<{
      key: string;
      label: string;
      kind: ActivityTypeView["dimensions"][number]["kind"];
      required: boolean;
      sortOrder: number;
      config: ActivityTypeView["dimensions"][number]["config"];
    }>;
  }) => {
    setSavingType(true);
    try {
      if (!editing) {
        await createActivityTypeAction(payload);
      } else {
        await updateActivityTypeAction(editing.id, {
          name: payload.name,
          color: payload.color,
          icon: payload.icon,
        });
        await replaceActivityDimensionsAction(editing.id, {
          dimensions: payload.dimensions,
        });
      }
      await refresh();
      setEditing(null);
      setShowForm(false);
      toast({ title: "Activity saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save activity type.", variant: "destructive" });
    } finally {
      setSavingType(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveActivityTypeAction(archiveTarget.id);
      await refresh();
      setArchiveTarget(null);
      toast({ title: "Activity archived" });
    } catch {
      toast({ title: "Error", description: "Failed to archive activity.", variant: "destructive" });
    }
  };

  const filteredLogs = React.useMemo(() => {
    if (!selectedDateStr) return logs;
    return logs.filter((l) => l.dateStr === selectedDateStr);
  }, [logs, selectedDateStr]);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-32 md:pt-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold">Habits & Activities</h1>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        {/* ── Overview tab ─────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <ActivityContributionGrid
            contributions={contributions}
            monthDate={monthDate}
            selectedDateStr={selectedDateStr}
            onSelectDate={setSelectedDateStr}
            onMonthChange={handleMonthChange}
            pinnedToHome={calendarPinned}
            onTogglePin={handleToggleCalendarPin}
          />

          <div className="flex gap-4">
            <div className="flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-purple-950/30 via-slate-950/20 to-black px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current streak</p>
            </div>
            <div className="flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-teal-950/40 via-slate-950/20 to-black px-4 py-3 text-center">
              <p className="text-2xl font-bold text-teal-400">{bestStreak}</p>
              <p className="text-xs text-muted-foreground">Best streak</p>
            </div>
          </div>

          {/* Per-activity tracker strips */}
          {types.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-medium text-muted-foreground">Per Activity</h2>
              {types.map((type) => (
                <ActivityTrackerStrip
                  key={type.id}
                  type={type}
                  logs={logs}
                  pinnedToHome={pinnedTypeIds.has(type.id)}
                  onTogglePin={handleToggleTypePin}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── History tab ──────────────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          {selectedDateStr && (
            <button
              type="button"
              onClick={() => setSelectedDateStr(null)}
              className="mb-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Showing {selectedDateStr} &mdash; tap to clear filter
            </button>
          )}
          <ActivityLogsList
            initialLogs={filteredLogs}
            activityTypes={types}
            onDeleted={refresh}
          />
        </TabsContent>

        {/* ── Library tab ──────────────────────────────────────────── */}
        <TabsContent value="library" className="mt-4 space-y-4">
          {/* <div className="flex flex-col items-center justify-between">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setShowForm((prev) => !prev);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              New Activity
            </Button>
          </div> */}

          {showForm && (
            <ActivityTypeForm
              initialType={editing}
              saving={savingType}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              onSave={handleSaveType}
            />
          )}

          <div className="space-y-3">
            {types.length === 0 && !showForm ? (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                No activities yet. Create one to start tracking.
              </div>
            ) : (
              types.map((type) => {
                const typeColor = type.color ?? FALLBACK_COLOR;
                const IconComp = type.icon ? ACTIVITY_ICON_MAP[type.icon] : null;
                return (
                  <div
                    key={type.id}
                    className="rounded-xl border border-white/10 bg-gradient-to-b from-emerald-950/20 to-neutral-900/40 p-4 flex items-center gap-3"
                    style={{ borderLeftWidth: 3, borderLeftColor: typeColor }}
                  >
                    {IconComp ? (
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: typeColor + "20" }}
                      >
                        <IconComp className="h-4.5 w-4.5" style={{ color: typeColor }} />
                      </div>
                    ) : (
                      <div
                        className="h-9 w-9 rounded-lg shrink-0"
                        style={{ backgroundColor: typeColor + "20" }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{type.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.dimensions.length} field{type.dimensions.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(type);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setArchiveTarget(type)}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Archive confirmation */}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive &ldquo;{archiveTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This activity type will be hidden from logging. Existing logs will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
