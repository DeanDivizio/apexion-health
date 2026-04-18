"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import type { VariationTemplate } from "@/lib/gym";

// ---------------------------------------------------------------------------
// VariationOptionSelect
// ---------------------------------------------------------------------------

interface VariationOptionSelectProps {
  template: VariationTemplate;
  value: string;
  onChange: (optionKey: string) => void;
  /** Optional per-option label overrides (from exercise-level overrides) */
  optionLabelOverrides?: Record<string, string>;
  /** Override the default compact trigger styling */
  triggerClassName?: string;
}

/**
 * Default-option picker for a single variation dimension.
 *
 * Built on Radix Select primitives (not the shared `SelectItem`) so each
 * option can render a multi-line row (label + description) while the
 * trigger still displays only the selected option's label.
 *
 * Accepts `optionLabelOverrides` to respect exercise-level label overrides
 * (e.g., a canonical exercise renaming "Neutral" → "Standard"). Descriptions
 * always come from the template because overrides don't carry descriptions.
 */
export function VariationOptionSelect({
  template,
  value,
  onChange,
  optionLabelOverrides,
  triggerClassName,
}: VariationOptionSelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left",
          triggerClassName,
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="relative z-50 max-h-96 min-w-[14rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1"
        >
          <SelectPrimitive.Viewport className="p-1 w-[var(--radix-select-trigger-width)] min-w-[14rem]">
            {template.options.map((opt) => {
              const displayLabel = optionLabelOverrides?.[opt.key] ?? opt.label;
              return (
                <SelectPrimitive.Item
                  key={opt.key}
                  value={opt.key}
                  className="relative flex w-full cursor-default select-none flex-col items-start gap-0.5 rounded-sm py-2 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 top-2.5 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-3.5 w-3.5" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText asChild>
                    <span className="text-sm font-medium leading-tight">
                      {displayLabel}
                    </span>
                  </SelectPrimitive.ItemText>
                  <span className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {opt.description}
                  </span>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// DimensionLabelWithTooltip
// ---------------------------------------------------------------------------

interface DimensionLabelWithTooltipProps {
  label: string;
  description: string;
  /** Override the default label text styling (e.g. for compact surfaces) */
  className?: string;
}

/**
 * Dimension-row label with an info icon that reveals the template's
 * description.
 *
 * Uses a Popover (not a Tooltip) so the description is dismissible and stays
 * open on tap. Radix Tooltip is hover-only and closes on pointer-down, which
 * makes it unusable on touch devices (including Firefox dev-tools touch
 * emulation). The popover opens on click/tap, and additionally on hover for
 * desktop users via a small open-on-hover delay.
 */
export function DimensionLabelWithTooltip({
  label,
  description,
  className,
}: DimensionLabelWithTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearHoverTimeout = React.useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => clearHoverTimeout, [clearHoverTimeout]);

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => setOpen(true), 200);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    clearHoverTimeout();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium truncate cursor-help min-w-0",
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <Info
            className="h-3 w-3 shrink-0 text-muted-foreground/60"
            aria-hidden
          />
          <span className="sr-only">Dimension details</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-auto max-w-xs px-3 py-2 text-xs"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {description}
      </PopoverContent>
    </Popover>
  );
}
