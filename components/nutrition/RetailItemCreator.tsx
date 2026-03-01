"use client";

import * as React from "react";
import { Camera, Upload, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui_primitives/dialog";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { useToast } from "@/hooks/use-toast";
import { extractNutritionLabelAction } from "@/actions/ocr";
import { createRetailUserItemAction } from "@/actions/nutrition";
import type { MealItemDraft, NutrientProfile } from "@/lib/nutrition";


interface RetailItemCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chainId: string;
  chainName: string;
  onAddItem: (item: MealItemDraft) => void;
}

interface ManualPrefill {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

type CreatorState =
  | { step: "choose" }
  | { step: "scanning"; preview: string }
  | { step: "scanError"; message: string }
  | { step: "manual"; prefill?: ManualPrefill };

export function RetailItemCreator({
  open,
  onOpenChange,
  chainId,
  chainName,
  onAddItem,
}: RetailItemCreatorProps) {
  const { toast } = useToast();
  const [state, setState] = React.useState<CreatorState>({ step: "choose" });
  const [submitting, setSubmitting] = React.useState(false);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const uploadRef = React.useRef<HTMLInputElement>(null);

  const [name, setName] = React.useState("");
  const [calories, setCalories] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [carbs, setCarbs] = React.useState("");
  const [fat, setFat] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setState({ step: "choose" });
      setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    }
  }, [open]);

  React.useEffect(() => {
    if (state.step === "manual" && state.prefill) {
      setName(state.prefill.name ?? "");
      setCalories(String(state.prefill.calories ?? ""));
      setProtein(String(state.prefill.protein ?? ""));
      setCarbs(String(state.prefill.carbs ?? ""));
      setFat(String(state.prefill.fat ?? ""));
    }
  }, [state]);

  async function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setState({ step: "scanning", preview: base64 });
      try {
        const result = await extractNutritionLabelAction(base64);
        setState({
          step: "manual",
          prefill: {
            name: result.foodName ?? "",
            calories: result.nutrients.calories,
            protein: result.nutrients.protein,
            carbs: result.nutrients.carbs,
            fat: result.nutrients.fat,
          },
        });
      } catch (err) {
        setState({
          step: "scanError",
          message: err instanceof Error ? err.message : "Extraction failed.",
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const nutrients: NutrientProfile = {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      };

      const created = await createRetailUserItemAction({
        chainId,
        name: name.trim(),
        category: null,
        nutrients,
        servingSize: null,
        servingUnit: null,
      });

      const draft: MealItemDraft = {
        localId: crypto.randomUUID(),
        foodSource: "retail",
        sourceFoodId: created.id,
        foundationFoodId: null,
        snapshotName: created.name,
        snapshotBrand: chainName,
        servings: 1,
        portionLabel: null,
        portionGramWeight: null,
        nutrients: created.nutrients,
      };
      onAddItem(draft);
      toast({ title: `${created.name} added to meal` });
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to create item.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add {chainName} Item</DialogTitle>
          <DialogDescription>
            Add a missing menu item to your personal database.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-1">
          {state.step === "choose" && (
            <div className="flex flex-col gap-3 items-center py-6">
              <Button
                variant="outline"
                className="w-full max-w-xs h-12 gap-2"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="h-5 w-5" />
                Scan / Upload
              </Button>
              <Button
                variant="outline"
                className="w-full max-w-xs h-12 gap-2"
                onClick={() => setState({ step: "manual" })}
              >
                Enter Manually
              </Button>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onInputChange} />
              <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
            </div>
          )}

          {state.step === "scanning" && (
            <div className="flex flex-col items-center gap-3 py-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.preview} alt="Preview" className="max-h-32 rounded-lg object-contain" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting...
              </div>
            </div>
          )}

          {state.step === "scanError" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {state.message}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setState({ step: "choose" })}>
                  Try Again
                </Button>
                <Button variant="outline" size="sm" onClick={() => setState({ step: "manual" })}>
                  Enter Manually
                </Button>
              </div>
            </div>
          )}

          {state.step === "manual" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Item Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Chicken Burrito Bowl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Calories *</Label>
                  <Input type="tel" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Protein (g)</Label>
                  <Input type="tel" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Carbs (g)</Label>
                  <Input type="tel" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fat (g)</Label>
                  <Input type="tel" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            </div>
          )}
        </div>

        {state.step === "manual" && (
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={submitting || !name.trim()}>
              {submitting ? "Saving..." : "Save & Add"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
