"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { useToast } from "@/hooks/use-toast";
import {
  archiveActivityTypeAction,
  createActivityTypeAction,
  listActivityLogsAction,
  listActivityTypesAction,
  replaceActivityDimensionsAction,
  updateActivityTypeAction,
} from "@/actions/activity";
import type { ActivityLogView, ActivityTypeView } from "@/lib/activity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_primitives/tabs";
import { ActivityTypeForm } from "./ActivityTypeForm";
import { ActivityLogsList } from "./ActivityLogsList";
import { ActivityLogger } from "./ActivityLogger";

interface ActivityCollectionProps {
  initialTypes: ActivityTypeView[];
  initialLogs: ActivityLogView[];
}

export function ActivityCollection({
  initialTypes,
  initialLogs,
}: ActivityCollectionProps) {
  const { toast } = useToast();
  const [types, setTypes] = React.useState<ActivityTypeView[]>(initialTypes);
  const [logs, setLogs] = React.useState<ActivityLogView[]>(initialLogs);
  const [editing, setEditing] = React.useState<ActivityTypeView | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [savingType, setSavingType] = React.useState(false);

  React.useEffect(() => {
    setTypes(initialTypes);
  }, [initialTypes]);

  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const refresh = React.useCallback(async () => {
    const [nextTypes, nextLogs] = await Promise.all([
      listActivityTypesAction(),
      listActivityLogsAction(),
    ]);
    setTypes(nextTypes);
    setLogs(nextLogs);
  }, []);

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
      toast({
        title: "Error",
        description: "Failed to save activity type.",
        variant: "destructive",
      });
    } finally {
      setSavingType(false);
    }
  };

  const handleArchive = async (activityTypeId: string) => {
    try {
      await archiveActivityTypeAction(activityTypeId);
      await refresh();
      toast({ title: "Activity archived" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to archive activity.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 md:pt-6 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Habits &amp; Activities</h1>
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
      </div>

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

      <Tabs defaultValue="log-new">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="log-new">Log</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>
        <TabsContent value="log-new" className="mt-4">
          <ActivityLogger
            activityTypes={types}
            showCardWrapper={false}
            onLogged={refresh}
          />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <ActivityLogsList
            initialLogs={logs}
            onDeleted={refresh}
          />
        </TabsContent>
        <TabsContent value="types" className="mt-4">
          <div className="space-y-3">
            {types.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-white/10 bg-neutral-900/40 p-4">
                No activity types yet. Create one to start logging habits and activities.
              </p>
            ) : (
              types.map((type) => (
                <div
                  key={type.id}
                  className="rounded-lg border border-white/10 bg-neutral-900/40 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {type.dimensions.length} dimension
                        {type.dimensions.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                        onClick={() => handleArchive(type.id)}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
