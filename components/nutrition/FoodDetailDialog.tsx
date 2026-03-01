"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui_primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Button } from "@/components/ui_primitives/button";
import { NUTRIENT_KEYS, resolveNutrientMeta } from "@/lib/nutrition/nutrientKeys";
import type {
  FoundationFoodView,
  MealItemDraft,
  NutrientProfile,
  NutritionUserFoodView,
  RetailItemView,
} from "@/lib/nutrition";

type FoodItem =
  | { type: "foundation"; data: FoundationFoodView }
  | { type: "complex"; data: NutritionUserFoodView }
  | { type: "retail"; data: RetailItemView; chainName?: string };

interface FoodDetailDialogProps {
  food: FoodItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: MealItemDraft) => void;
}

function scaleNutrients(nutrients: NutrientProfile, factor: number): NutrientProfile {
  const result: Record<string, number | undefined> = {};
  for (const [key, val] of Object.entries(nutrients)) {
    result[key] = typeof val === "number" ? val * factor : undefined;
  }
  return result as NutrientProfile;
}

export function FoodDetailDialog({ food, open, onOpenChange, onAddItem }: FoodDetailDialogProps) {
  const [servings, setServings] = React.useState(1);
  const [selectedPortionIdx, setSelectedPortionIdx] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setServings(1);
      setSelectedPortionIdx(0);
    }
  }, [open]);

  if (!food) return null;

  const isFoundation = food.type === "foundation";
  const portions = isFoundation ? food.data.portions : [];
  const hasPortion = portions.length > 0;

  const portionGramWeight = hasPortion
    ? portions[selectedPortionIdx]?.gramWeight ?? 100
    : null;
  const portionLabel = hasPortion
    ? `${portions[selectedPortionIdx]?.amount ?? 1} ${portions[selectedPortionIdx]?.unit ?? "serving"}${portions[selectedPortionIdx]?.modifier ? ` (${portions[selectedPortionIdx].modifier})` : ""}`
    : null;

  const baseNutrients = (() => {
    switch (food.type) {
      case "foundation": return food.data.nutrients;
      case "complex": return food.data.nutrients;
      case "retail": return food.data.nutrients;
    }
  })();

  const displayScale = isFoundation && portionGramWeight != null
    ? (portionGramWeight / 100) * servings
    : servings;

  const displayNutrients = scaleNutrients(baseNutrients, displayScale);

  const foodName = (() => {
    switch (food.type) {
      case "foundation": return food.data.name;
      case "complex": return food.data.name;
      case "retail": return food.data.name;
    }
  })();

  const subtitle = (() => {
    switch (food.type) {
      case "foundation": return "Foundation Food";
      case "complex": return food.data.brand ?? "My Food";
      case "retail": return food.chainName ?? "Restaurant";
    }
  })();

  function handleAdd() {
    const item: MealItemDraft = {
      localId: crypto.randomUUID(),
      foodSource: food!.type === "foundation" ? "foundation" : food!.type === "complex" ? "complex" : "retail",
      sourceFoodId: food!.type === "complex" ? food!.data.id : food!.type === "retail" ? food!.data.id : null,
      foundationFoodId: food!.type === "foundation" ? food!.data.id : null,
      snapshotName: foodName,
      snapshotBrand: food!.type === "complex" ? food!.data.brand : food!.type === "retail" ? (food!.chainName ?? null) : null,
      servings,
      portionLabel: portionLabel,
      portionGramWeight: portionGramWeight,
      nutrients: baseNutrients,
    };
    onAddItem(item);
    onOpenChange(false);
  }

  const knownKeys = new Set(Object.keys(NUTRIENT_KEYS));
  const nutrientDisplay = Object.entries(displayNutrients)
    .filter(([key, val]) => key !== "calories" && val != null && val !== 0)
    .map(([key, val]) => {
      const meta = resolveNutrientMeta(key);
      return { name: meta.name, value: val!, unit: meta.unit, known: knownKeys.has(key) };
    })
    .sort((a, b) => (a.known === b.known ? 0 : a.known ? -1 : 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            {foodName}
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-1">
          {/* Portion selector for foundation foods */}
          {isFoundation && hasPortion && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Portion</label>
              <Select
                value={String(selectedPortionIdx)}
                onValueChange={(v) => setSelectedPortionIdx(Number(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {portions.map((p, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {p.amount} {p.unit}{p.modifier ? ` (${p.modifier})` : ""} — {p.gramWeight}g
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Servings */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Servings</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={servings <= 0.25}
                onClick={() => setServings((s) => Math.max(0.25, s - 0.5))}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{servings}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setServings((s) => s + 0.5)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Nutrition facts */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Nutrition Facts (for selection)
            </p>
            <div className="rounded-lg border border-border/40 px-3 py-2 space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span>Calories</span>
                <span>{Math.round(displayNutrients.calories)} kcal</span>
              </div>
              <div className="h-px bg-border/40 my-1" />
              {nutrientDisplay.map((n) => (
                <div key={n.name} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{n.name}</span>
                  <span>
                    {n.value < 1 ? n.value.toFixed(2) : Math.round(n.value)} {n.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} className="w-full h-11">
            Add to Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
