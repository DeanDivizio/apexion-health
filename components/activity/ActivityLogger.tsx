"use client";

import * as React from "react";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { Textarea } from "@/components/ui_primitives/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import type { ActivityDimensionView, ActivityTypeView } from "@/lib/activity";
import type { CreateActivityLogInput } from "@/lib/activity";
import { createActivityLogAction } from "@/actions/activity";
import { useToast } from "@/hooks/use-toast";
import { toCompactDateStr } from "@/lib/dates/dateStr";

interface ActivityLoggerProps {
  activityTypes: ActivityTypeView[];
  onLogged?: () => Promise<void> | void;
  showCardWrapper?: boolean;
}

interface ValueDraft {
  textValue: string;
  numberValue: string;
  unitValue: string;
  dateValue: string;
  timeValue: string;
  dateTimeValueIso: string;
  intValue: string;
}

function emptyValuePayload(base: {
  key: string;
  label: string;
  kind: ActivityDimensionView["kind"];
}): {
  key: string;
  label: string;
  kind: ActivityDimensionView["kind"];
  textValue: string | null;
  numberValue: number | null;
  unitValue: string | null;
  dateValue: string | null;
  timeValue: string | null;
  dateTimeValueIso: string | null;
  intValue: number | null;
  jsonValue: unknown;
} {
  return {
    ...base,
    textValue: null,
    numberValue: null,
    unitValue: null,
    dateValue: null,
    timeValue: null,
    dateTimeValueIso: null,
    intValue: null,
    jsonValue: null,
  };
}

function initialValueForDimension(dimension: ActivityDimensionView): ValueDraft {
  return {
    textValue: "",
    numberValue: "",
    unitValue: dimension.config?.defaultUnit ?? "",
    dateValue: "",
    timeValue: "",
    dateTimeValueIso: "",
    intValue: "",
  };
}

function toIsoFromLocalDateTime(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function ActivityLogger({
  activityTypes,
  onLogged,
  showCardWrapper = true,
}: ActivityLoggerProps) {
  const { toast } = useToast();
  const [selectedActivityTypeId, setSelectedActivityTypeId] = React.useState<string>(
    activityTypes[0]?.id ?? "",
  );
  const [loggedAtDate, setLoggedAtDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [loggedAtTime, setLoggedAtTime] = React.useState<string>(
    `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
  );
  const [saving, setSaving] = React.useState(false);

  const selectedType = React.useMemo(
    () => activityTypes.find((type) => type.id === selectedActivityTypeId) ?? null,
    [activityTypes, selectedActivityTypeId],
  );

  const [valueDrafts, setValueDrafts] = React.useState<Record<string, ValueDraft>>({});

  React.useEffect(() => {
    if (!selectedType) return;
    setValueDrafts((prev) => {
      const next: Record<string, ValueDraft> = {};
      for (const dimension of selectedType.dimensions) {
        next[dimension.key] = prev[dimension.key] ?? initialValueForDimension(dimension);
      }
      return next;
    });
  }, [selectedType]);

  const handleSave = async () => {
    if (!selectedType) {
      toast({
        title: "Select an activity",
        description: "Pick an activity type before logging.",
        variant: "destructive",
      });
      return;
    }

    const localDateTime = new Date(`${loggedAtDate}T${loggedAtTime || "00:00"}`);
    if (Number.isNaN(localDateTime.getTime())) {
      toast({
        title: "Invalid date/time",
        description: "Please choose a valid date and time.",
        variant: "destructive",
      });
      return;
    }

    const values: CreateActivityLogInput["values"] = [];
    for (const dimension of selectedType.dimensions) {
      const draft = valueDrafts[dimension.key] ?? initialValueForDimension(dimension);
      const base = {
        key: dimension.key,
        label: dimension.label,
        kind: dimension.kind,
      } as const;

      if (dimension.kind === "text") {
        const textValue = draft.textValue.trim();
        if (dimension.required && !textValue) {
          toast({
            title: "Missing required field",
            description: `${dimension.label} is required.`,
            variant: "destructive",
          });
          return;
        }
        values.push({
          ...emptyValuePayload(base),
          textValue: textValue || null,
        });
        continue;
      }

      if (dimension.kind === "number" || dimension.kind === "number_with_unit") {
        const parsed = draft.numberValue ? Number(draft.numberValue) : null;
        if (dimension.required && parsed == null) {
          toast({
            title: "Missing required field",
            description: `${dimension.label} is required.`,
            variant: "destructive",
          });
          return;
        }
        values.push({
          ...emptyValuePayload(base),
          numberValue: Number.isFinite(parsed as number) ? parsed : null,
          unitValue: dimension.kind === "number_with_unit" ? draft.unitValue || null : null,
        });
        continue;
      }

      if (dimension.kind === "date") {
        if (dimension.required && !draft.dateValue) {
          toast({
            title: "Missing required field",
            description: `${dimension.label} is required.`,
            variant: "destructive",
          });
          return;
        }
        values.push({
          ...emptyValuePayload(base),
          dateValue: draft.dateValue || null,
        });
        continue;
      }

      if (dimension.kind === "time") {
        if (dimension.required && !draft.timeValue) {
          toast({
            title: "Missing required field",
            description: `${dimension.label} is required.`,
            variant: "destructive",
          });
          return;
        }
        values.push({
          ...emptyValuePayload(base),
          timeValue: draft.timeValue || null,
        });
        continue;
      }

      if (dimension.kind === "datetime") {
        const iso = toIsoFromLocalDateTime(draft.dateTimeValueIso);
        if (dimension.required && !iso) {
          toast({
            title: "Missing required field",
            description: `${dimension.label} is required.`,
            variant: "destructive",
          });
          return;
        }
        values.push({
          ...emptyValuePayload(base),
          dateTimeValueIso: iso,
        });
        continue;
      }

      if (dimension.kind === "scale_1_5") {
        const intValue = draft.intValue ? Number(draft.intValue) : null;
        if (dimension.required && intValue == null) {
          toast({
            title: "Missing required field",
            description: `${dimension.label} is required.`,
            variant: "destructive",
          });
          return;
        }
        values.push({
          ...emptyValuePayload(base),
          intValue:
            intValue != null && Number.isFinite(intValue)
              ? Math.max(1, Math.min(5, Math.round(intValue)))
              : null,
        });
      }
    }

    const payload: CreateActivityLogInput = {
      activityTypeId: selectedType.id,
      loggedAtIso: localDateTime.toISOString(),
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      values,
    };

    setSaving(true);
    try {
      await createActivityLogAction(payload);
      toast({
        title: "Activity logged",
        description: `${selectedType.name} recorded.`,
      });
      const today = new Date();
      setLoggedAtDate(today.toISOString().slice(0, 10));
      setLoggedAtTime(
        `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`,
      );
      setValueDrafts(() => {
        const next: Record<string, ValueDraft> = {};
        for (const dimension of selectedType.dimensions) {
          next[dimension.key] = initialValueForDimension(dimension);
        }
        return next;
      });
      await onLogged?.();
    } catch {
      toast({
        title: "Error",
        description: "Unable to save activity log.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!activityTypes.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 p-4 text-sm text-muted-foreground">
        Create an activity type first to start logging.
      </div>
    );
  }

  const content = (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <Label>Activity</Label>
          <Select
            value={selectedActivityTypeId}
            onValueChange={setSelectedActivityTypeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select activity" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input
            type="date"
            value={loggedAtDate}
            max={toCompactDateStr(new Date()).replace(
              /(\d{4})(\d{2})(\d{2})/,
              "$1-$2-$3",
            )}
            onChange={(event) => setLoggedAtDate(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Time</Label>
        <Input
          type="time"
          value={loggedAtTime}
          onChange={(event) => setLoggedAtTime(event.target.value)}
        />
      </div>

      {selectedType?.dimensions.map((dimension) => {
        const draft = valueDrafts[dimension.key] ?? initialValueForDimension(dimension);
        const requiredSuffix = dimension.required ? " *" : "";

        if (dimension.kind === "text") {
          return (
            <div key={dimension.key} className="space-y-1">
              <Label>{dimension.label}{requiredSuffix}</Label>
              <Textarea
                value={draft.textValue}
                onChange={(event) =>
                  setValueDrafts((prev) => ({
                    ...prev,
                    [dimension.key]: {
                      ...draft,
                      textValue: event.target.value,
                    },
                  }))
                }
                rows={2}
              />
            </div>
          );
        }

        if (dimension.kind === "number") {
          return (
            <div key={dimension.key} className="space-y-1">
              <Label>{dimension.label}{requiredSuffix}</Label>
              <Input
                type="number"
                value={draft.numberValue}
                onChange={(event) =>
                  setValueDrafts((prev) => ({
                    ...prev,
                    [dimension.key]: {
                      ...draft,
                      numberValue: event.target.value,
                    },
                  }))
                }
              />
            </div>
          );
        }

        if (dimension.kind === "number_with_unit") {
          const units = dimension.config?.allowedUnits ?? [];
          return (
            <div key={dimension.key} className="space-y-1">
              <Label>{dimension.label}{requiredSuffix}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  className="col-span-2"
                  value={draft.numberValue}
                  onChange={(event) =>
                    setValueDrafts((prev) => ({
                      ...prev,
                      [dimension.key]: {
                        ...draft,
                        numberValue: event.target.value,
                      },
                    }))
                  }
                />
                {units.length > 0 ? (
                  <Select
                    value={draft.unitValue || units[0]}
                    onValueChange={(value) =>
                      setValueDrafts((prev) => ({
                        ...prev,
                        [dimension.key]: {
                          ...draft,
                          unitValue: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={draft.unitValue}
                    onChange={(event) =>
                      setValueDrafts((prev) => ({
                        ...prev,
                        [dimension.key]: {
                          ...draft,
                          unitValue: event.target.value,
                        },
                      }))
                    }
                    placeholder="unit"
                  />
                )}
              </div>
            </div>
          );
        }

        if (dimension.kind === "date") {
          return (
            <div key={dimension.key} className="space-y-1">
              <Label>{dimension.label}{requiredSuffix}</Label>
              <Input
                type="date"
                value={draft.dateValue}
                onChange={(event) =>
                  setValueDrafts((prev) => ({
                    ...prev,
                    [dimension.key]: {
                      ...draft,
                      dateValue: event.target.value,
                    },
                  }))
                }
              />
            </div>
          );
        }

        if (dimension.kind === "time") {
          return (
            <div key={dimension.key} className="space-y-1">
              <Label>{dimension.label}{requiredSuffix}</Label>
              <Input
                type="time"
                value={draft.timeValue}
                onChange={(event) =>
                  setValueDrafts((prev) => ({
                    ...prev,
                    [dimension.key]: {
                      ...draft,
                      timeValue: event.target.value,
                    },
                  }))
                }
              />
            </div>
          );
        }

        if (dimension.kind === "datetime") {
          return (
            <div key={dimension.key} className="space-y-1">
              <Label>{dimension.label}{requiredSuffix}</Label>
              <Input
                type="datetime-local"
                value={draft.dateTimeValueIso}
                onChange={(event) =>
                  setValueDrafts((prev) => ({
                    ...prev,
                    [dimension.key]: {
                      ...draft,
                      dateTimeValueIso: event.target.value,
                    },
                  }))
                }
              />
            </div>
          );
        }

        return (
          <div key={dimension.key} className="space-y-1">
            <Label>{dimension.label}{requiredSuffix}</Label>
            <Select
              value={draft.intValue}
              onValueChange={(value) =>
                setValueDrafts((prev) => ({
                  ...prev,
                  [dimension.key]: {
                    ...draft,
                    intValue: value,
                  },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select 1 - 5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Log Activity"}
        </Button>
      </div>
    </>
  );

  if (!showCardWrapper) return <div className="space-y-4">{content}</div>;

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-neutral-900/40 p-4">
      {content}
    </div>
  );
}
