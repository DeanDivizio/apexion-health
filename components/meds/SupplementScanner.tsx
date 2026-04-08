"use client";

import * as React from "react";
import { Camera, Upload, Loader2, AlertCircle, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
import { Button } from "@/components/ui_primitives/button";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { extractSupplementLabelAction } from "@/actions/ocr";
import { compressImage } from "@/lib/compressImage";
import type { SupplementLabelData } from "@/lib/ocr/extractSupplementLabel";

export interface SupplementScanResult {
  productName: string;
  brand: string;
  ingredients: Array<{ name: string; amountPerServing: string; unit: string }>;
}

interface SupplementScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (data: SupplementScanResult) => void;
}

type ScanState =
  | { step: "capture" }
  | { step: "processing"; preview: string }
  | { step: "error"; message: string }
  | { step: "review"; data: SupplementLabelData };

export function SupplementScanner({
  open,
  onOpenChange,
  onResult,
}: SupplementScannerProps) {
  const [state, setState] = React.useState<ScanState>({ step: "capture" });
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const uploadRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) setState({ step: "capture" });
  }, [open]);

  async function handleFile(file: File) {
    try {
      const base64 = await compressImage(file);
      setState({ step: "processing", preview: base64 });
      const result = await extractSupplementLabelAction(base64);
      if (result.ingredients.length === 0) {
        setState({
          step: "error",
          message:
            "No ingredients found on the label. Try a clearer photo of the Supplement Facts panel.",
        });
        return;
      }
      setState({ step: "review", data: result });
    } catch (err) {
      setState({
        step: "error",
        message:
          err instanceof Error ? err.message : "Failed to extract supplement data.",
      });
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleAccept(data: SupplementLabelData) {
    onResult({
      productName: data.productName ?? "",
      brand: data.brand ?? "",
      ingredients: data.ingredients.map((i) => ({
        name: i.name,
        amountPerServing: String(i.amountPerServing),
        unit: i.unit,
      })),
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>Scan Supplement Label</SheetTitle>
          <SheetDescription>
            {state.step === "review"
              ? "Review the extracted ingredients before importing."
              : "Take a photo or upload an image of a Supplement Facts panel."}
          </SheetDescription>
        </SheetHeader>

        {state.step === "capture" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
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

        {state.step === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.preview}
              alt="Label preview"
              className="max-h-40 rounded-lg object-contain"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting supplement ingredients...
            </div>
          </div>
        )}

        {state.step === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {state.message}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setState({ step: "capture" })}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {state.step === "review" && (
          <>
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-3 pb-4">
                {(state.data.productName || state.data.brand) && (
                  <div className="text-sm space-y-0.5">
                    {state.data.productName && (
                      <p className="font-medium">{state.data.productName}</p>
                    )}
                    {state.data.brand && (
                      <p className="text-muted-foreground">{state.data.brand}</p>
                    )}
                    {state.data.servingSize && (
                      <p className="text-xs text-muted-foreground">
                        Serving: {state.data.servingSize}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-md border border-border/40">
                  <div className="px-3 py-2 border-b border-border/40">
                    <p className="text-xs font-medium text-muted-foreground">
                      {state.data.ingredients.length} ingredient
                      {state.data.ingredients.length === 1 ? "" : "s"} found
                    </p>
                  </div>
                  <div className="divide-y divide-border/40">
                    {state.data.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 break-words">{ing.name}</span>
                        <span className="shrink-0 text-muted-foreground tabular-nums whitespace-nowrap">
                          {ing.amountPerServing} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 px-4 py-4 border-t border-border/40">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setState({ step: "capture" })}
              >
                Rescan
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleAccept(state.data)}
              >
                <Check className="h-4 w-4 mr-2" />
                Use These
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
