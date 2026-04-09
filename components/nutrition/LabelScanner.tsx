"use client";

import * as React from "react";
import { Camera, Upload, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui_primitives/drawer";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { Textarea } from "@/components/ui_primitives/textarea";
import { useToast } from "@/hooks/use-toast";
import { extractNutritionLabelAction } from "@/actions/ocr";
import { createUserFoodAction } from "@/actions/nutrition";
import { compressImage } from "@/lib/compressImage";
import { captureClientEvent } from "@/lib/posthog-client";
import type { MealItemDraft, NutrientProfile, NutritionUserFoodView } from "@/lib/nutrition";

interface LabelScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: MealItemDraft) => void;
  onUserFoodCreated: (food: NutritionUserFoodView) => void;
}

type ScanState =
  | { step: "capture" }
  | { step: "processing"; preview: string }
  | { step: "error"; message: string }
  | { step: "review"; data: ExtractedData };

interface ExtractedData {
  name: string;
  brand: string;
  servingSize: number;
  servingUnit: string;
  nutrients: Partial<NutrientProfile>;
  ingredients: string;
}

export function LabelScanner({ open, onOpenChange, onAddItem, onUserFoodCreated }: LabelScannerProps) {
  const { toast } = useToast();
  const [state, setState] = React.useState<ScanState>({ step: "capture" });
  const [submitting, setSubmitting] = React.useState(false);
  const [showMore, setShowMore] = React.useState(false);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const uploadRef = React.useRef<HTMLInputElement>(null);

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
    if (open) {
      setState({ step: "capture" });
      resetForm();
    }
  }, [open]);

  function resetForm() {
    setName(""); setBrand(""); setServingSize("1"); setServingUnit("serving");
    setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setSaturatedFat(""); setTransFat(""); setFiber(""); setSugars("");
    setAddedSugars(""); setCholesterol(""); setSodium(""); setCalcium("");
    setIron(""); setPotassium(""); setVitaminA(""); setVitaminC(""); setVitaminD("");
    setIngredients(""); setShowMore(false); setSubmitting(false);
  }

  function populateFromExtracted(data: ExtractedData) {
    setName(data.name);
    setBrand(data.brand);
    setServingSize(String(data.servingSize));
    setServingUnit(data.servingUnit);
    const n = data.nutrients;
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
    setIngredients(data.ingredients);
    if (Object.keys(n).length > 4) setShowMore(true);
  }

  async function handleFile(file: File) {
    try {
      const base64 = await compressImage(file);
      setState({ step: "processing", preview: base64 });
      const result = await extractNutritionLabelAction(base64);
      const nutrients = result.nutrients as Partial<NutrientProfile>;
      const extracted: ExtractedData = {
        name: result.foodName ?? "",
        brand: result.brand ?? "",
        servingSize: result.servingSize,
        servingUnit: result.servingUnit,
        nutrients,
        ingredients: result.ingredients ?? "",
      };
      populateFromExtracted(extracted);
      setState({ step: "review", data: extracted });
    } catch (err) {
      setState({
        step: "error",
        message: err instanceof Error ? err.message : "OCR extraction failed.",
      });
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-500" />
            {state.step === "capture" && "Scan Nutrition Label"}
            {state.step === "processing" && "Extracting..."}
            {state.step === "review" && "Review Scanned Label"}
            {state.step === "error" && "Something Went Wrong"}
          </DrawerTitle>
          <DrawerDescription>
            {state.step === "capture" && "Take a photo or upload an image of a nutrition facts label."}
            {state.step === "processing" && "Reading the nutrition data from your label..."}
            {state.step === "review" && "Verify the extracted data below, then save."}
            {state.step === "error" && "We hit a snag. You can try again."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {/* ── Capture ──────────────────────────────────── */}
          {state.step === "capture" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Button
                variant="outline"
                className="w-full max-w-xs h-12 gap-2"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="h-5 w-5" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                className="w-full max-w-xs h-12 gap-2"
                onClick={() => uploadRef.current?.click()}
              >
                <Upload className="h-5 w-5" />
                Upload Image
              </Button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onInputChange}
              />
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onInputChange}
              />
            </div>
          )}

          {/* ── Processing ───────────────────────────────── */}
          {state.step === "processing" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.preview}
                alt="Label preview"
                className="max-h-40 rounded-lg object-contain"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting nutrition data...
              </div>
            </div>
          )}

          {/* ── Review (inline form) ─────────────────────── */}
          {state.step === "review" && (
            <div className="space-y-3 py-1">
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
          )}

          {/* ── Error ────────────────────────────────────── */}
          {state.step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {state.message}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          {state.step === "review" && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={submitting || !name.trim()}>
                {submitting ? "Saving..." : "Save & Add"}
              </Button>
            </div>
          )}

          {state.step === "error" && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setState({ step: "capture" })}>
                Try Again
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
