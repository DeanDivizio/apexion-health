"use client";

import * as React from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui_primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import type { VariationTemplate } from "@/lib/gym";

interface DimensionAddPickerProps {
  availableTemplates: VariationTemplate[];
  onAdd: (templateId: string) => void;
  disabled?: boolean;
}

/**
 * Searchable "Add dimension" picker shared by the Create and Edit custom
 * exercise sheets. Opens a Popover containing a Command palette with live
 * filter across the full variation template registry.
 */
export function DimensionAddPicker({
  availableTemplates,
  onAdd,
  disabled,
}: DimensionAddPickerProps) {
  const [open, setOpen] = useState(false);

  if (availableTemplates.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-start h-9 text-muted-foreground font-normal"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Add dimension</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search dimensions..."
            className="h-9"
          />
          <CommandList className="max-h-72">
            <CommandEmpty>No dimensions found.</CommandEmpty>
            <CommandGroup>
              {availableTemplates.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.label} ${t.description}`}
                  onSelect={() => {
                    onAdd(t.id);
                    setOpen(false);
                  }}
                  className="flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {t.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
