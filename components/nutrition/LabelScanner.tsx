"use client";

import * as React from "react";
import { Camera, Upload, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui_primitives/dialog";
import { Button } from "@/components/ui_primitives/button";
import { ManualFoodForm } from "./ManualFoodForm";
import { extractNutritionLabelAction } from "@/actions/ocr";
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
  const [state, setState] = React.useState<ScanState>({ step: "capture" });
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const uploadRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) setState({ step: "capture" });
  }, [open]);

  async function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setState({ step: "processing", preview: base64 });
      try {
        const result = await extractNutritionLabelAction(base64);
        const nutrients = result.nutrients as Partial<NutrientProfile>;
        setState({
          step: "review",
          data: {
            name: result.foodName ?? "",
            brand: result.brand ?? "",
            servingSize: result.servingSize,
            servingUnit: result.servingUnit,
            nutrients,
            ingredients: result.ingredients ?? "",
          },
        });
      } catch (err) {
        setState({
          step: "error",
          message: err instanceof Error ? err.message : "OCR extraction failed.",
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

  if (state.step === "review") {
    return (
      <ManualFoodForm
        open={open}
        onOpenChange={onOpenChange}
        onAddItem={onAddItem}
        onUserFoodCreated={onUserFoodCreated}
        prefill={state.data}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Scan Nutrition Label</DialogTitle>
          <DialogDescription>
            Take a photo or upload an image of a nutrition facts label.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-4">
          {state.step === "capture" && (
            <>
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
            </>
          )}

          {state.step === "processing" && (
            <>
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
            </>
          )}

          {state.step === "error" && (
            <>
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {state.message}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setState({ step: "capture" })}>
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    setTimeout(() => {
                      setState({ step: "capture" });
                    }, 200);
                  }}
                >
                  Enter Manually
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
