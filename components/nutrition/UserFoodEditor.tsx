"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
import { Input } from "@/components/ui_primitives/input";
import { Textarea } from "@/components/ui_primitives/textarea";
import { Button } from "@/components/ui_primitives/button";
import { Label } from "@/components/ui_primitives/label";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui_primitives/accordion";
import { updateUserFoodAction } from "@/actions/nutrition";
import { useToast } from "@/hooks/use-toast";
import type { NutritionUserFoodView } from "@/lib/nutrition";

interface UserFoodEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFood: NutritionUserFoodView | null;
  onSaved: (food: NutritionUserFoodView) => void;
}

const OPTIONAL_NUTRIENTS = [
  { key: "saturatedFat", label: "Saturated Fat", unit: "g" },
  { key: "transFat", label: "Trans Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugars", label: "Sugars", unit: "g" },
  { key: "addedSugars", label: "Added Sugars", unit: "g" },
  { key: "cholesterol", label: "Cholesterol", unit: "mg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "magnesium", label: "Magnesium", unit: "mg" },
  { key: "vitaminA", label: "Vitamin A", unit: "mcg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg" },
] as const;

function parseNum(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function UserFoodEditor({ open, onOpenChange, editingFood, onSaved }: UserFoodEditorProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [servingSize, setServingSize] = React.useState("");
  const [servingUnit, setServingUnit] = React.useState("g");
  const [calories, setCalories] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [carbs, setCarbs] = React.useState("");
  const [fat, setFat] = React.useState("");
  const [optionalNutrients, setOptionalNutrients] = React.useState<Record<string, string>>({});
  const [ingredients, setIngredients] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open || !editingFood) return;
    setName(editingFood.name);
    setBrand(editingFood.brand ?? "");
    setServingSize(String(editingFood.servingSize));
    setServingUnit(editingFood.servingUnit);
    setCalories(String(editingFood.nutrients.calories));
    setProtein(String(editingFood.nutrients.protein));
    setCarbs(String(editingFood.nutrients.carbs));
    setFat(String(editingFood.nutrients.fat));
    const opt: Record<string, string> = {};
    for (const { key } of OPTIONAL_NUTRIENTS) {
      const val = editingFood.nutrients[key];
      if (val !== undefined && val !== null) {
        opt[key] = String(val);
      }
    }
    setOptionalNutrients(opt);
    setIngredients(editingFood.ingredients ?? "");
  }, [open, editingFood]);

  function setOptionalNutrient(key: string, value: string) {
    setOptionalNutrients((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!editingFood || !name.trim()) return;
    setSubmitting(true);
    try {
      const nutrients: Record<string, number> = {
        calories: parseNum(calories),
        protein: parseNum(protein),
        carbs: parseNum(carbs),
        fat: parseNum(fat),
      };
      for (const { key } of OPTIONAL_NUTRIENTS) {
        const raw = optionalNutrients[key];
        if (raw !== undefined && raw !== "") {
          nutrients[key] = parseNum(raw);
        }
      }

      const result = await updateUserFoodAction(editingFood.id, {
        name: name.trim(),
        brand: brand.trim() || null,
        servingSize: parseNum(servingSize) || editingFood.servingSize,
        servingUnit: servingUnit.trim() || "g",
        nutrients,
        ingredients: ingredients.trim() || null,
      });
      onSaved(result);
      onOpenChange(false);
      toast({ title: "Food updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update food.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>Edit Food</SheetTitle>
          <SheetDescription>Update the name, brand, or nutrition data for this food.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
            </div>

            <div className="space-y-1">
              <Label>Brand</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Optional"
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Serving Size</Label>
                <Input
                  type="tel"
                  inputMode="decimal"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input
                  value={servingUnit}
                  onChange={(e) => setServingUnit(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Macros
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Calories</Label>
                  <Input
                    type="tel"
                    inputMode="decimal"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Protein (g)</Label>
                  <Input
                    type="tel"
                    inputMode="decimal"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Carbs (g)</Label>
                  <Input
                    type="tel"
                    inputMode="decimal"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fat (g)</Label>
                  <Input
                    type="tel"
                    inputMode="decimal"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="micro">
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2">
                  Micronutrients
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-3">
                    {OPTIONAL_NUTRIENTS.map(({ key, label, unit }) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">{label} ({unit})</Label>
                        <Input
                          type="tel"
                          inputMode="decimal"
                          value={optionalNutrients[key] ?? ""}
                          onChange={(e) => setOptionalNutrient(key, e.target.value)}
                          placeholder="—"
                          className="h-9"
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-1">
              <Label>Ingredients</Label>
              <Textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 px-4 py-4 border-t border-border/40">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={submitting || !name.trim()}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
