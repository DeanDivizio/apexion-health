"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Checkbox } from "@/components/ui_primitives/checkbox";
import type { ActivityDimensionKind, ActivityTypeView } from "@/lib/activity";

const KIND_OPTIONS: Array<{ value: ActivityDimensionKind; label: string }> = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "number_with_unit", label: "Number + Unit" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "datetime", label: "Date + Time" },
  { value: "scale_1_5", label: "1 - 5 Scale" },
];

interface EditableDimension {
  key: string;
  label: string;
  kind: ActivityDimensionKind;
  required: boolean;
  sortOrder: number;
  config: {
    allowedUnits?: string[];
    defaultUnit?: string;
    min?: number;
    max?: number;
    step?: number;
  } | null;
}

interface ActivityTypeFormProps {
  initialType?: ActivityTypeView | null;
  onSave: (payload: {
    name: string;
    color: string | null;
    icon: string | null;
    dimensions: EditableDimension[];
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

function slugifyKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export function ActivityTypeForm({
  initialType,
  onSave,
  onCancel,
  saving = false,
}: ActivityTypeFormProps) {
  const [name, setName] = React.useState(initialType?.name ?? "");
  const [color, setColor] = React.useState(initialType?.color ?? "");
  const [icon, setIcon] = React.useState(initialType?.icon ?? "");
  const [dimensions, setDimensions] = React.useState<EditableDimension[]>(
    initialType?.dimensions.map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      kind: dimension.kind,
      required: dimension.required,
      sortOrder: dimension.sortOrder,
      config: dimension.config,
    })) ?? [],
  );

  const sanitizeDimensions = React.useCallback((items: EditableDimension[]) => {
    return items
      .map((dimension, index) => ({
        ...dimension,
        key: slugifyKey(dimension.key || dimension.label),
        label: dimension.label.trim(),
        sortOrder: index,
      }))
      .filter((dimension) => dimension.key && dimension.label);
  }, []);

  const addDimension = () => {
    setDimensions((prev) => [
      ...prev,
      {
        key: "",
        label: "",
        kind: "text",
        required: false,
        sortOrder: prev.length,
        config: null,
      },
    ]);
  };

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-neutral-900/40 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Reading"
          />
        </div>
        <div className="space-y-1">
          <Label>Color (optional)</Label>
          <Input
            value={color}
            onChange={(event) => setColor(event.target.value)}
            placeholder="#10b981"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Icon (optional)</Label>
        <Input
          value={icon}
          onChange={(event) => setIcon(event.target.value)}
          placeholder="book"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Dimensions</h3>
          <Button type="button" size="sm" variant="outline" onClick={addDimension}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {dimensions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No dimensions yet. Add fields like start time, duration, notes, or rating.
          </p>
        )}

        {dimensions.map((dimension, index) => (
          <div
            key={`${dimension.key}-${index}`}
            className="rounded-md border border-white/10 p-3 space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                value={dimension.label}
                onChange={(event) =>
                  setDimensions((prev) =>
                    prev.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            label: event.target.value,
                            key: item.key || slugifyKey(event.target.value),
                          }
                        : item,
                    ),
                  )
                }
                placeholder="Label (e.g. Duration)"
              />
              <Input
                value={dimension.key}
                onChange={(event) =>
                  setDimensions((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, key: slugifyKey(event.target.value) } : item,
                    ),
                  )
                }
                placeholder="field_key"
              />
              <Select
                value={dimension.kind}
                onValueChange={(value) =>
                  setDimensions((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, kind: value as ActivityDimensionKind } : item,
                    ),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dimension.kind === "number_with_unit" && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input
                  value={dimension.config?.allowedUnits?.join(",") ?? ""}
                  onChange={(event) =>
                    setDimensions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              config: {
                                ...(item.config ?? {}),
                                allowedUnits: event.target.value
                                  .split(",")
                                  .map((entry) => entry.trim())
                                  .filter(Boolean),
                              },
                            }
                          : item,
                      ),
                    )
                  }
                  placeholder="Allowed units (comma separated)"
                />
                <Input
                  value={dimension.config?.defaultUnit ?? ""}
                  onChange={(event) =>
                    setDimensions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? {
                              ...item,
                              config: {
                                ...(item.config ?? {}),
                                defaultUnit: event.target.value.trim() || undefined,
                              },
                            }
                          : item,
                      ),
                    )
                  }
                  placeholder="Default unit"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={dimension.required}
                  onCheckedChange={(checked) =>
                    setDimensions((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, required: checked === true } : item,
                      ),
                    )
                  }
                />
                Required
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() =>
                  setDimensions((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={saving || !name.trim()}
          onClick={() => {
            const sanitized = sanitizeDimensions(dimensions);
            const deduped = new Set<string>();
            const unique = sanitized.filter((dimension) => {
              if (deduped.has(dimension.key)) return false;
              deduped.add(dimension.key);
              return true;
            });
            onSave({
              name: name.trim(),
              color: color.trim() || null,
              icon: icon.trim() || null,
              dimensions: unique,
            });
          }}
        >
          {saving ? "Saving..." : "Save Activity"}
        </Button>
      </div>
    </div>
  );
}
