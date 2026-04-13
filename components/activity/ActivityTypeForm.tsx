"use client";

import * as React from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import { ACTIVITY_ICON_MAP, ACTIVITY_ICON_OPTIONS } from "./activityIconMap";

const KIND_OPTIONS: Array<{ value: ActivityDimensionKind; label: string }> = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "number_with_unit", label: "Number + Unit" },
  { value: "time", label: "Time" },
  { value: "scale_1_5", label: "1 - 5 Scale" },
];

const COLOR_PALETTE = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // purple
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
  /** When true, renders without the outer card border/background. */
  bare?: boolean;
  /** When provided, replaces the built-in action buttons. Receives { onSubmit, onCancel, saving, disabled }. */
  renderActions?: (ctx: { onSubmit: () => void; onCancel: () => void; saving: boolean; disabled: boolean; accentColor: string }) => React.ReactNode;
}

function parseUnits(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function UnitsInput({ units, onChange }: { units: string[]; onChange: (units: string[]) => void }) {
  const [raw, setRaw] = React.useState(() => units.join(", "));

  const prevUnitsRef = React.useRef(units);
  if (units !== prevUnitsRef.current && units.join(",") !== parseUnits(raw).join(",")) {
    setRaw(units.join(", "));
    prevUnitsRef.current = units;
  }

  return (
    <Input
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => onChange(parseUnits(raw))}
      placeholder="Allowed units (comma separated)"
    />
  );
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
  bare = false,
  renderActions,
}: ActivityTypeFormProps) {
  const [name, setName] = React.useState(initialType?.name ?? "");
  const [color, setColor] = React.useState(initialType?.color ?? COLOR_PALETTE[0]);
  const [icon, setIcon] = React.useState(initialType?.icon ?? "");
  const uidRef = React.useRef(0);
  const nextUid = () => ++uidRef.current;

  const [dimensions, setDimensions] = React.useState<(EditableDimension & { _uid: number })[]>(
    () =>
      initialType?.dimensions.map((d) => ({
        _uid: ++uidRef.current,
        key: d.key,
        label: d.label,
        kind: d.kind,
        required: d.required,
        sortOrder: d.sortOrder,
        config: d.config,
      })) ?? [],
  );
  const sanitizeDimensions = React.useCallback((items: EditableDimension[]) => {
    return items
      .map((d, i) => ({
        ...d,
        key: slugifyKey(d.key || d.label),
        label: d.label.trim(),
        sortOrder: i,
      }))
      .filter((d) => d.key && d.label);
  }, []);

  const [freshUid, setFreshUid] = React.useState<number | null>(null);

  const addDimension = () => {
    const uid = nextUid();
    setFreshUid(uid);
    setDimensions((prev) => [
      ...prev,
      { _uid: uid, key: "", label: "", kind: "text", required: false, sortOrder: prev.length, config: null },
    ]);
  };

  const freshLabelRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      if (!node) return;
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.focus();
      setFreshUid(null);
    },
    [],
  );

  const moveDimension = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= dimensions.length) return;
    setDimensions((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = () => {
    const sanitized = sanitizeDimensions(dimensions);
    const seen = new Set<string>();
    const unique = sanitized.filter((d) => {
      if (seen.has(d.key)) return false;
      seen.add(d.key);
      return true;
    });
    onSave({
      name: name.trim(),
      color: color || null,
      icon: icon || null,
      dimensions: unique,
    });
  };

  return (
    <div className={bare ? "space-y-5" : "space-y-5 rounded-xl border border-white/10 bg-neutral-900/40 p-5 mt-4"}>
      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-sm">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Reading, Meditation, Running"
        />
      </div>

      {/* Color picker */}
      <div className="space-y-2">
        <Label className="text-sm">Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map((c) => {
            const isSelected = color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  "h-8 w-8 rounded-full transition-all border-2",
                  isSelected ? "scale-110 border-white shadow-lg" : "border-transparent hover:scale-105",
                ].join(" ")}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
                aria-pressed={isSelected}
              />
            );
          })}
        </div>
      </div>

      {/* Icon picker */}
      <div className="space-y-2">
        <Label className="text-sm">Icon</Label>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_ICON_OPTIONS.map((key) => {
            const IconComp = ACTIVITY_ICON_MAP[key];
            const isSelected = icon === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(isSelected ? "" : key)}
                className={[
                  "h-9 w-9 rounded-lg flex items-center justify-center transition-all border",
                  isSelected
                    ? "border-white/50 bg-white/10 text-white"
                    : "border-white/5 bg-neutral-800/50 text-neutral-500 hover:bg-neutral-700/50 hover:text-neutral-300",
                ].join(" ")}
                aria-label={key}
                aria-pressed={isSelected}
              >
                <IconComp className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      {name.trim() && (
        <div className="rounded-lg border border-white/5 bg-neutral-800/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground mb-1.5">Preview</p>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: color || COLOR_PALETTE[0] }}
            />
            {icon && ACTIVITY_ICON_MAP[icon] ? (
              <span style={{ color: color || COLOR_PALETTE[0] }}>
                {React.createElement(ACTIVITY_ICON_MAP[icon], { className: "h-4 w-4" })}
              </span>
            ) : null}
            <span className="text-sm font-medium">{name.trim()}</span>
          </div>
        </div>
      )}

      {/* Fields (dimensions) */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Fields</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Data you want to track each time you log this activity. Date/Time logged is included by default.
          </p>
        </div>

        {dimensions.length === 0 && (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-white/10 p-4 text-center">
            Date/Time logged is included by default. Add additional fields as needed.
          </p>
        )}

        {dimensions.map((dim, index) => (
          <div
            key={dim._uid}
            className="rounded-lg border border-white/10 bg-neutral-800/20 p-3 space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr]">
              <Input
                ref={dim._uid === freshUid ? freshLabelRef : undefined}
                value={dim.label}
                onChange={(e) =>
                  setDimensions((prev) =>
                    prev.map((item, i) =>
                      i === index
                        ? { ...item, label: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Label (e.g. Duration)"
              />
              <Select
                value={dim.kind}
                onValueChange={(v) =>
                  setDimensions((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, kind: v as ActivityDimensionKind } : item,
                    ),
                  )
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dim.kind === "number_with_unit" && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <UnitsInput
                  units={dim.config?.allowedUnits ?? []}
                  onChange={(units) =>
                    setDimensions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, config: { ...(item.config ?? {}), allowedUnits: units } }
                          : item,
                      ),
                    )
                  }
                />
                <Input
                  value={dim.config?.defaultUnit ?? ""}
                  onChange={(e) =>
                    setDimensions((prev) =>
                      prev.map((item, i) =>
                        i === index
                          ? { ...item, config: { ...(item.config ?? {}), defaultUnit: e.target.value.trim() || undefined } }
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
                  checked={dim.required}
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
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => moveDimension(index, -1)}
                  disabled={index === 0}
                  aria-label="Move field up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => moveDimension(index, 1)}
                  disabled={index === dimensions.length - 1}
                  aria-label="Move field down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-400 hover:text-red-300"
                  onClick={() => setDimensions((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Remove field"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button type="button" size="sm" variant="outline" onClick={addDimension} className="w-full">
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add field
        </Button>
      </div>

      {/* Actions */}
      {renderActions
        ? renderActions({ onSubmit: handleSubmit, onCancel, saving, disabled: !name.trim(), accentColor: color || COLOR_PALETTE[0] })
        : (
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !name.trim()}
              onClick={handleSubmit}
              style={{ backgroundColor: color || COLOR_PALETTE[0] }}
              className="text-white"
            >
              {saving ? "Saving..." : "Save Activity"}
            </Button>
          </div>
        )}
    </div>
  );
}
