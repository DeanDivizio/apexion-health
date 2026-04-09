"use client";

import * as React from "react";
import {
  Camera,
  Upload,
  Loader2,
  AlertCircle,
  Send,
  Pencil,
  Trash2,
  ChevronDown,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui_primitives/drawer";
import { Button } from "@/components/ui_primitives/button";
import { Checkbox } from "@/components/ui_primitives/checkbox";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { Textarea } from "@/components/ui_primitives/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  estimateMealFromPhotoAction,
  refineMealEstimateAction,
} from "@/actions/ocr";
import { compressImage } from "@/lib/compressImage";
import type { EstimatedFoodItem, PhotoEstimateResponse } from "@/lib/ocr/estimateMealFromPhoto";
import type { MealItemDraft, NutrientProfile } from "@/lib/nutrition";
import { captureClientEvent } from "@/lib/posthog-client";

const DISCLAIMER_DISMISSED_KEY = "photo-estimator-disclaimer-dismissed";

interface PhotoEstimatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItems: (items: MealItemDraft[]) => void;
}

type Stage =
  | { step: "disclaimer" }
  | { step: "capture" }
  | { step: "context"; imageBase64: string; preview: string }
  | { step: "refining"; preview: string }
  | { step: "review"; items: EditableItem[] }
  | { step: "error"; message: string };

interface EditableItem extends EstimatedFoodItem {
  localId: string;
  editing: boolean;
}

function getInitialStep(): Stage {
  if (typeof window !== "undefined") {
    const dismissed = localStorage.getItem(DISCLAIMER_DISMISSED_KEY);
    if (dismissed === "true") return { step: "capture" };
  }
  return { step: "disclaimer" };
}

function estimateToEditableItems(estimate: PhotoEstimateResponse): EditableItem[] {
  return estimate.items.map((item) => ({
    ...item,
    localId: crypto.randomUUID(),
    editing: false,
  }));
}

export function PhotoEstimator({ open, onOpenChange, onAddItems }: PhotoEstimatorProps) {
  const { toast } = useToast();
  const [stage, setStage] = React.useState<Stage>(getInitialStep);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const [userContext, setUserContext] = React.useState("");
  const [initialEstimateReady, setInitialEstimateReady] = React.useState(false);
  const [submittingContext, setSubmittingContext] = React.useState(false);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const uploadRef = React.useRef<HTMLInputElement>(null);
  const initialEstimatePromiseRef = React.useRef<Promise<PhotoEstimateResponse> | null>(null);
  const imageBase64Ref = React.useRef<string>("");

  React.useEffect(() => {
    if (open) {
      setStage(getInitialStep());
      setUserContext("");
      setDontShowAgain(false);
      setInitialEstimateReady(false);
      setSubmittingContext(false);
      initialEstimatePromiseRef.current = null;
      imageBase64Ref.current = "";
    }
  }, [open]);

  function handleFile(file: File) {
    compressImage(file).then((base64) => {
      imageBase64Ref.current = base64;
      setUserContext("");
      setInitialEstimateReady(false);
      setStage({ step: "context", imageBase64: base64, preview: base64 });

      const promise = estimateMealFromPhotoAction(base64);
      initialEstimatePromiseRef.current = promise;

      promise.then(() => {
        setInitialEstimateReady(true);
      }).catch(() => {
        // Error is handled when the user submits/skips context
      });
    }).catch((err) => {
      setStage({
        step: "error",
        message: err instanceof Error ? err.message : "Failed to process image.",
      });
    });
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDisclaimerContinue() {
    if (dontShowAgain) {
      localStorage.setItem(DISCLAIMER_DISMISSED_KEY, "true");
    }
    setStage({ step: "capture" });
  }

  async function handleSubmitContext() {
    if (stage.step !== "context") return;
    const promise = initialEstimatePromiseRef.current;
    if (!promise) return;

    const contextText = userContext.trim();
    const preview = stage.preview;

    setSubmittingContext(true);

    try {
      const initialEstimate = await promise;

      if (!contextText) {
        setStage({ step: "review", items: estimateToEditableItems(initialEstimate) });
        return;
      }

      setStage({ step: "refining", preview });

      const refined = await refineMealEstimateAction(
        imageBase64Ref.current,
        initialEstimate,
        contextText,
      );

      setStage({ step: "review", items: estimateToEditableItems(refined) });
    } catch (err) {
      setStage({
        step: "error",
        message: err instanceof Error ? err.message : "Failed to estimate meal.",
      });
    } finally {
      setSubmittingContext(false);
    }
  }

  async function handleSkipContext() {
    if (stage.step !== "context") return;
    const promise = initialEstimatePromiseRef.current;
    if (!promise) return;

    setSubmittingContext(true);

    try {
      const initialEstimate = await promise;
      setStage({ step: "review", items: estimateToEditableItems(initialEstimate) });
    } catch (err) {
      setStage({
        step: "error",
        message: err instanceof Error ? err.message : "Failed to estimate meal.",
      });
    } finally {
      setSubmittingContext(false);
    }
  }

  function handleUpdateItem(localId: string, updates: Partial<EditableItem>) {
    if (stage.step !== "review") return;
    setStage({
      ...stage,
      items: stage.items.map((item) =>
        item.localId === localId ? { ...item, ...updates } : item,
      ),
    });
  }

  function handleUpdateItemNutrient(localId: string, key: string, value: number) {
    if (stage.step !== "review") return;
    setStage({
      ...stage,
      items: stage.items.map((item) =>
        item.localId === localId
          ? { ...item, nutrients: { ...item.nutrients, [key]: value } }
          : item,
      ),
    });
  }

  function handleRemoveItem(localId: string) {
    if (stage.step !== "review") return;
    setStage({
      ...stage,
      items: stage.items.filter((item) => item.localId !== localId),
    });
  }

  function handleAddAllToMeal() {
    if (stage.step !== "review") return;

    const drafts: MealItemDraft[] = stage.items.map((item) => ({
      localId: crypto.randomUUID(),
      foodSource: "complex" as const,
      sourceFoodId: null,
      foundationFoodId: null,
      snapshotName: item.name,
      snapshotBrand: null,
      servings: 1,
      portionLabel: `${item.servingSize} ${item.servingUnit}`,
      portionGramWeight: null,
      nutrients: item.nutrients as NutrientProfile,
    }));

    onAddItems(drafts);
    captureClientEvent("photo_estimate_items_added", {
      item_count: drafts.length,
    });
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {stage.step === "disclaimer" && "AI Meal Estimation"}
            {stage.step === "capture" && "Take a Photo"}
            {stage.step === "context" && "Add Context"}
            {stage.step === "refining" && "Refining Estimate"}
            {stage.step === "review" && "Review Items"}
            {stage.step === "error" && "Something Went Wrong"}
          </DrawerTitle>
          <DrawerDescription>
            {stage.step === "disclaimer" && "Please read before continuing."}
            {stage.step === "capture" && "Snap a picture of your meal."}
            {stage.step === "context" && "Help us improve the estimate with details."}
            {stage.step === "refining" && "Refining the estimate with your context..."}
            {stage.step === "review" && "Edit items below, then add them to your meal."}
            {stage.step === "error" && "We hit a snag. You can try again."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {/* ── Stage: Disclaimer ─────────────────────────── */}
          {stage.step === "disclaimer" && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">This feature uses AI to estimate nutrition from a photo.</strong>
                  </p>
                  <p>
                    Estimates may be inaccurate. Portion sizes, hidden ingredients, cooking
                    methods, and image quality all affect accuracy. This is intended as a{" "}
                    <strong className="text-foreground">last resort</strong> when no other
                    nutrition info is available (e.g. restaurant meals, food prepared by
                    others).
                  </p>
                  <p>
                    Always review and adjust the estimated values before saving.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={dontShowAgain}
                  onCheckedChange={(v) => setDontShowAgain(v === true)}
                />
                <span className="text-sm text-muted-foreground">Don&apos;t show this again</span>
              </label>
            </div>
          )}

          {/* ── Stage: Capture ────────────────────────────── */}
          {stage.step === "capture" && (
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

          {/* ── Stage: Context (shown immediately while initial estimate runs) ── */}
          {stage.step === "context" && (
            <div className="space-y-4 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stage.preview}
                alt="Meal preview"
                className="max-h-32 rounded-lg object-contain mx-auto"
              />

              {!initialEstimateReady && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing photo in background...
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm">
                  Any details about this meal? <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  placeholder='e.g. "Pad Thai from a local restaurant, large portion" or "Homemade chicken stir fry with brown rice, cooked in olive oil"'
                  rows={3}
                  className="resize-none"
                  disabled={submittingContext}
                />
                <p className="text-xs text-muted-foreground">
                  Restaurant name, cooking method, portion size, or anything else that helps.
                </p>
              </div>
            </div>
          )}

          {/* ── Stage: Refining ───────────────────────────── */}
          {stage.step === "refining" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stage.preview}
                alt="Meal preview"
                className="max-h-32 rounded-lg object-contain"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Refining estimate with your context...
              </div>
            </div>
          )}

          {/* ── Stage: Review ─────────────────────────────── */}
          {stage.step === "review" && (
            <div className="space-y-3 py-2">
              {stage.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items. The AI couldn&apos;t identify any foods.
                </p>
              )}
              {stage.items.map((item) => (
                <ReviewItemCard
                  key={item.localId}
                  item={item}
                  onUpdate={(updates) => handleUpdateItem(item.localId, updates)}
                  onUpdateNutrient={(key, val) => handleUpdateItemNutrient(item.localId, key, val)}
                  onRemove={() => handleRemoveItem(item.localId)}
                />
              ))}
            </div>
          )}

          {/* ── Stage: Error ──────────────────────────────── */}
          {stage.step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {stage.message}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          {stage.step === "disclaimer" && (
            <Button onClick={handleDisclaimerContinue} className="w-full">
              I Understand, Continue
            </Button>
          )}

          {stage.step === "context" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSkipContext}
                disabled={submittingContext}
              >
                {submittingContext && !userContext.trim() ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Waiting...</>
                ) : "Skip"}
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleSubmitContext}
                disabled={submittingContext}
              >
                {submittingContext ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  <><Send className="h-4 w-4" />{userContext.trim() ? "Refine Estimate" : "Continue"}</>
                )}
              </Button>
            </div>
          )}

          {stage.step === "review" && stage.items.length > 0 && (
            <Button onClick={handleAddAllToMeal} className="w-full">
              Add {stage.items.length} Item{stage.items.length !== 1 ? "s" : ""} to Meal
            </Button>
          )}

          {stage.step === "error" && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStage({ step: "capture" })}>
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

function ReviewItemCard({
  item,
  onUpdate,
  onUpdateNutrient,
  onRemove,
}: {
  item: EditableItem;
  onUpdate: (updates: Partial<EditableItem>) => void;
  onUpdateNutrient: (key: string, value: number) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const n = item.nutrients;

  if (item.editing) {
    return (
      <div className="rounded-lg border border-border p-3 space-y-2.5">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Serving size</Label>
            <Input
              type="tel"
              inputMode="decimal"
              value={String(item.servingSize)}
              onChange={(e) => onUpdate({ servingSize: Number(e.target.value) || 0 })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit</Label>
            <Input
              value={item.servingUnit}
              onChange={(e) => onUpdate({ servingUnit: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NutrientField label="Calories" value={n.calories} onChange={(v) => onUpdateNutrient("calories", v)} />
          <NutrientField label="Protein (g)" value={n.protein} onChange={(v) => onUpdateNutrient("protein", v)} />
          <NutrientField label="Carbs (g)" value={n.carbs} onChange={(v) => onUpdateNutrient("carbs", v)} />
          <NutrientField label="Fat (g)" value={n.fat} onChange={(v) => onUpdateNutrient("fat", v)} />
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Hide" : "More"} nutrients
        </button>

        {expanded && (
          <div className="grid grid-cols-2 gap-2">
            <NutrientField label="Sat. Fat (g)" value={n.saturatedFat} onChange={(v) => onUpdateNutrient("saturatedFat", v)} />
            <NutrientField label="Fiber (g)" value={n.fiber} onChange={(v) => onUpdateNutrient("fiber", v)} />
            <NutrientField label="Sugars (g)" value={n.sugars} onChange={(v) => onUpdateNutrient("sugars", v)} />
            <NutrientField label="Sodium (mg)" value={n.sodium} onChange={(v) => onUpdateNutrient("sodium", v)} />
            <NutrientField label="Cholesterol (mg)" value={n.cholesterol} onChange={(v) => onUpdateNutrient("cholesterol", v)} />
          </div>
        )}

        <Button size="sm" className="w-full" onClick={() => onUpdate({ editing: false })}>
          Done Editing
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.servingSize} {item.servingUnit} &middot; {Math.round(n.calories)} cal &middot; {Math.round(n.protein)}p / {Math.round(n.carbs)}c / {Math.round(n.fat)}f
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onUpdate({ editing: true })}
          className="p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="Edit item"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
      </div>
    </div>
  );
}

function NutrientField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="tel"
        inputMode="decimal"
        value={value != null ? String(Math.round(value * 10) / 10) : ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 text-sm"
      />
    </div>
  );
}
