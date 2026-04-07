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
import { MedPresetCard } from "./MedPresetCard";
import { MedPresetBuilder } from "./MedPresetBuilder";
import { deleteMedicationPresetAction } from "@/actions/medication";
import { useToast } from "@/hooks/use-toast";
import type {
  MedicationPresetView,
  SubstanceCatalogItemView,
} from "@/lib/medication";

interface MedPresetsListProps {
  initialPresets: MedicationPresetView[];
  substances: SubstanceCatalogItemView[];
  onCreateNewSubstance: () => void;
}

export function MedPresetsList({
  initialPresets,
  substances,
  onCreateNewSubstance,
}: MedPresetsListProps) {
  const { toast } = useToast();
  const [presets, setPresets] = React.useState(initialPresets);
  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [editingPreset, setEditingPreset] =
    React.useState<MedicationPresetView | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setPresets(initialPresets);
  }, [initialPresets]);

  function handleEdit(preset: MedicationPresetView) {
    setEditingPreset(preset);
    setBuilderOpen(true);
  }

  function handleCreate() {
    setEditingPreset(null);
    setBuilderOpen(true);
  }

  function handleSaved(saved: MedicationPresetView) {
    setPresets((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteMedicationPresetAction(deleteId);
      setPresets((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Preset deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete preset.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="w-full mt-6 pt-2">
        <Button size="sm" className="gap-1.5 w-full" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>

      {presets.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No presets yet. Create one to quickly log your go-to meds &amp;
          supplements.
        </p>
      )}

      <div className="space-y-3">
        {presets.map((preset) => (
          <MedPresetCard
            key={preset.id}
            preset={preset}
            onEdit={() => handleEdit(preset)}
            onDelete={() => setDeleteId(preset.id)}
          />
        ))}
      </div>

      <MedPresetBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        editingPreset={editingPreset}
        onSaved={handleSaved}
        substances={substances}
        onCreateNewSubstance={onCreateNewSubstance}
      />

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
