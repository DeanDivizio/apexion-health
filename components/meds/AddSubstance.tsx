"use client";

import { Layers, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { SubstanceCombobox } from "./SubstanceCombobox";
import type {
  MedicationPresetView,
  SubstanceCatalogItemView,
} from "@/lib/medication";

interface AddSubstanceProps {
  substances: SubstanceCatalogItemView[];
  selectedSubstanceId: string;
  onSelectSubstance: (substanceId: string) => void;
  onCreateNewSubstance: () => void;
  stagedCount: number;
  presets: MedicationPresetView[];
  selectedPresetId: string;
  onSelectedPresetIdChange: (presetId: string) => void;
  onApplyPreset: () => void;
  onLogPreset: () => void;
  submitting: boolean;
}

export function AddSubstance({
  substances,
  selectedSubstanceId,
  onSelectSubstance,
  onCreateNewSubstance,
  stagedCount,
  presets,
  selectedPresetId,
  onSelectedPresetIdChange,
  onApplyPreset,
  onLogPreset,
  submitting,
}: AddSubstanceProps) {
  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 space-y-8 w-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Log Medication
        </h2>
        <p className="text-sm text-muted-foreground">
          {stagedCount > 0
            ? `${stagedCount} item${stagedCount > 1 ? "s" : ""} staged`
            : "Log a substance or populate from a preset"}
        </p>
      </div>

      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 px-1">
          <PlusCircle className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-muted-foreground">
            Substance
          </span>
        </div>
        <SubstanceCombobox
          substances={substances}
          value={selectedSubstanceId}
          onSelect={onSelectSubstance}
          onCreateNew={onCreateNewSubstance}
        />
      </div>

      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          or
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Layers className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-muted-foreground">
            Preset
          </span>
        </div>
        <div className="space-y-2">
          <Select
            value={selectedPresetId || undefined}
            onValueChange={onSelectedPresetIdChange}
            disabled={presets.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  presets.length === 0 ? "None saved" : "Select a preset..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                  <span className="ml-1.5 text-muted-foreground">
                    ({preset.items.length} item
                    {preset.items.length === 1 ? "" : "s"})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={onApplyPreset}
              disabled={!selectedPresetId}
              variant="outline"
            >
              Stage
            </Button>
            <Button
              type="button"
              onClick={onLogPreset}
              disabled={!selectedPresetId || submitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? "Logging..." : "Log"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
