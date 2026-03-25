"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
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
import { Textarea } from "@/components/ui_primitives/textarea";
import { useToast } from "@/hooks/use-toast";
import { createUserFoodAction } from "@/actions/nutrition";
import { captureClientEvent } from "@/lib/posthog-client";
import type { MealItemDraft, NutritionUserFoodView, NutrientProfile } from "@/lib/nutrition";

interface ManualFoodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: MealItemDraft) => void;
  onUserFoodCreated: (food: NutritionUserFoodView) => void;
  prefill?: Partial<{
    name: string;
    brand: string;
    servingSize: number;
    servingUnit: string;
    nutrients: Partial<NutrientProfile>;
    ingredients: string;
  }>;
}

export function ManualFoodForm({
  open,
  onOpenChange,
  onAddItem,
  onUserFoodCreated,
  prefill,
}: ManualFoodFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [showMore, setShowMore] = React.useState(false);

  const [name, setName] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [servingSize, setServingSize] = React.useState("1");
  const [servingUnit, setServingUnit] = React.useState("serving");
  const [calories, setCalories] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [carbs, setCarbs] = React.useState("");
  const [fat, setFat] = React.useState("");
  const [saturatedFat, setSaturatedFat] = React.useState("");
  const [transFat, setTransFat] = React.useState("");
  const [fiber, setFiber] = React.useState("");
  const [sugars, setSugars] = React.useState("");
  const [addedSugars, setAddedSugars] = React.useState("");
  const [cholesterol, setCholesterol] = React.useState("");
  const [sodium, setSodium] = React.useState("");
  const [calcium, setCalcium] = React.useState("");
  const [iron, setIron] = React.useState("");
  const [potassium, setPotassium] = React.useState("");
  const [vitaminA, setVitaminA] = React.useState("");
  const [vitaminC, setVitaminC] = React.useState("");
  const [vitaminD, setVitaminD] = React.useState("");
  const [ingredients, setIngredients] = React.useState("");

  React.useEffect(() => {
    if (open && prefill) {
      setName(prefill.name ?? "");
      setBrand(prefill.brand ?? "");
      setServingSize(String(prefill.servingSize ?? 1));
      setServingUnit(prefill.servingUnit ?? "serving");
      const n = prefill.nutrients;
      if (n) {
        setCalories(String(n.calories ?? ""));
        setProtein(String(n.protein ?? ""));
        setCarbs(String(n.carbs ?? ""));
        setFat(String(n.fat ?? ""));
        setSaturatedFat(n.saturatedFat != null ? String(n.saturatedFat) : "");
        setTransFat(n.transFat != null ? String(n.transFat) : "");
        setFiber(n.fiber != null ? String(n.fiber) : "");
        setSugars(n.sugars != null ? String(n.sugars) : "");
        setAddedSugars(n.addedSugars != null ? String(n.addedSugars) : "");
        setCholesterol(n.cholesterol != null ? String(n.cholesterol) : "");
        setSodium(n.sodium != null ? String(n.sodium) : "");
        setCalcium(n.calcium != null ? String(n.calcium) : "");
        setIron(n.iron != null ? String(n.iron) : "");
        setPotassium(n.potassium != null ? String(n.potassium) : "");
        setVitaminA(n.vitaminA != null ? String(n.vitaminA) : "");
        setVitaminC(n.vitaminC != null ? String(n.vitaminC) : "");
        setVitaminD(n.vitaminD != null ? String(n.vitaminD) : "");
        if (Object.keys(n).length > 4) setShowMore(true);
      }
      setIngredients(prefill.ingredients ?? "");
    }
    if (open && !prefill) {
      resetForm();
    }
  }, [open, prefill]);

  function resetForm() {
    setName(""); setBrand(""); setServingSize("1"); setServingUnit("serving");
    setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setSaturatedFat(""); setTransFat(""); setFiber(""); setSugars("");
    setAddedSugars(""); setCholesterol(""); setSodium(""); setCalcium("");
    setIron(""); setPotassium(""); setVitaminA(""); setVitaminC(""); setVitaminD("");
    setIngredients(""); setShowMore(false);
  }

  function num(v: string): number { return Number(v) || 0; }
  function optNum(v: string): number | undefined { return v.trim() ? Number(v) || 0 : undefined; }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!calories.trim()) {
      toast({ title: "Calories required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const nutrients: NutrientProfile = {
        calories: num(calories),
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
        saturatedFat: optNum(saturatedFat),
        transFat: optNum(transFat),
        fiber: optNum(fiber),
        sugars: optNum(sugars),
        addedSugars: optNum(addedSugars),
        cholesterol: optNum(cholesterol),
        sodium: optNum(sodium),
        calcium: optNum(calcium),
        iron: optNum(iron),
        potassium: optNum(potassium),
        vitaminA: optNum(vitaminA),
        vitaminC: optNum(vitaminC),
        vitaminD: optNum(vitaminD),
      };

      const created = await createUserFoodAction({
        name: name.trim(),
        brand: brand.trim() || null,
        nutrients,
        servingSize: num(servingSize) || 1,
        servingUnit: servingUnit.trim() || "serving",
        ingredients: ingredients.trim() || null,
      });
      captureClientEvent("nutrition_user_food_created", {
        has_brand: !!created.brand,
        has_ingredients: !!created.ingredients,
      });

      onUserFoodCreated(created);

      const draft: MealItemDraft = {
        localId: crypto.randomUUID(),
        foodSource: "complex",
        sourceFoodId: created.id,
        foundationFoodId: null,
        snapshotName: created.name,
        snapshotBrand: created.brand,
        servings: 1,
        portionLabel: null,
        portionGramWeight: null,
        nutrients: created.nutrients,
      };
      onAddItem(draft);

      toast({ title: `${created.name} created and added to meal` });
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to create food.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Food Manually</DialogTitle>
          <DialogDescription>Create a food and add it to your meal.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-1">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Kirkland Protein Bar" />
          </div>

          <div className="space-y-1">
            <Label>Brand <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g., Kirkland" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Serving size</Label>
              <Input type="tel" inputMode="decimal" value={servingSize} onChange={(e) => setServingSize(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Input value={servingUnit} onChange={(e) => setServingUnit(e.target.value)} placeholder="g, oz, serving" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NField label="Calories *" value={calories} onChange={setCalories} />
            <NField label="Protein (g)" value={protein} onChange={setProtein} />
            <NField label="Carbs (g)" value={carbs} onChange={setCarbs} />
            <NField label="Fat (g)" value={fat} onChange={setFat} />
          </div>

          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${showMore ? "rotate-180" : ""}`} />
            {showMore ? "Hide" : "More"} nutrients
          </button>

          {showMore && (
            <div className="grid grid-cols-2 gap-2">
              <NField label="Saturated Fat (g)" value={saturatedFat} onChange={setSaturatedFat} />
              <NField label="Trans Fat (g)" value={transFat} onChange={setTransFat} />
              <NField label="Fiber (g)" value={fiber} onChange={setFiber} />
              <NField label="Sugars (g)" value={sugars} onChange={setSugars} />
              <NField label="Added Sugars (g)" value={addedSugars} onChange={setAddedSugars} />
              <NField label="Cholesterol (mg)" value={cholesterol} onChange={setCholesterol} />
              <NField label="Sodium (mg)" value={sodium} onChange={setSodium} />
              <NField label="Calcium (mg)" value={calcium} onChange={setCalcium} />
              <NField label="Iron (mg)" value={iron} onChange={setIron} />
              <NField label="Potassium (mg)" value={potassium} onChange={setPotassium} />
              <NField label="Vitamin A (mcg)" value={vitaminA} onChange={setVitaminA} />
              <NField label="Vitamin C (mg)" value={vitaminC} onChange={setVitaminC} />
              <NField label="Vitamin D (mcg)" value={vitaminD} onChange={setVitaminD} />
            </div>
          )}

          <div className="space-y-1">
            <Label>Ingredients <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Paste ingredients list..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={submitting || !name.trim()}>
            {submitting ? "Saving..." : "Save & Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="tel"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
