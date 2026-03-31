"use client";

import * as React from "react";
import { Minus, Plus, Search, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui_primitives/dialog";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { Label } from "@/components/ui_primitives/label";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { FoodResultCard } from "./FoodResultCard";
import { FoodDetailDialog } from "./FoodDetailDialog";
import {
  searchFoodsAction,
  createFoodPresetAction,
  updateFoodPresetAction,
} from "@/actions/nutrition";
import { useToast } from "@/hooks/use-toast";
import type {
  FoodPresetView,
  FoundationFoodView,
  MealItemDraft,
  NutrientProfile,
  NutritionUserFoodView,
} from "@/lib/nutrition";

type SelectedFood =
  | { type: "foundation"; data: FoundationFoodView }
  | { type: "complex"; data: NutritionUserFoodView };

interface PresetBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPreset?: FoodPresetView | null;
  onSaved: (preset: FoodPresetView) => void;
}

export function PresetBuilder({ open, onOpenChange, editingPreset, onSaved }: PresetBuilderProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [items, setItems] = React.useState<MealItemDraft[]>([]);
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [foundationResults, setFoundationResults] = React.useState<FoundationFoodView[]>([]);
  const [userFoodResults, setUserFoodResults] = React.useState<NutritionUserFoodView[]>([]);
  const [selectedFood, setSelectedFood] = React.useState<SelectedFood | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const isSearching = query.trim().length >= 2;
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    if (!open) return;
    if (editingPreset) {
      setName(editingPreset.name);
      setItems(
        editingPreset.items.map((item) => ({
          localId: crypto.randomUUID(),
          ...item,
          nutrients: item.nutrients as NutrientProfile,
        })),
      );
    } else {
      setName("");
      setItems([]);
    }
    setQuery("");
    setFoundationResults([]);
    setUserFoodResults([]);
  }, [open, editingPreset]);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isSearching) {
      setFoundationResults([]);
      setUserFoodResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchFoodsAction(query.trim());
        setFoundationResults(results.foundation);
        setUserFoodResults(results.userFoods);
      } catch {
        setFoundationResults([]);
        setUserFoodResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isSearching]);

  function handleAddItem(item: MealItemDraft) {
    setItems((prev) => [...prev, item]);
    setQuery("");
    toast({ title: `${item.snapshotName} added` });
  }

  async function handleSave() {
    if (!name.trim() || items.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        items: items.map((item) => ({
          foodSource: item.foodSource,
          sourceFoodId: item.sourceFoodId,
          foundationFoodId: item.foundationFoodId,
          snapshotName: item.snapshotName,
          snapshotBrand: item.snapshotBrand,
          servings: item.servings,
          portionLabel: item.portionLabel,
          portionGramWeight: item.portionGramWeight,
          nutrients: item.nutrients,
        })),
      };

      let result: FoodPresetView;
      if (editingPreset) {
        result = await updateFoodPresetAction(editingPreset.id, payload);
        toast({ title: "Preset updated" });
      } else {
        result = await createFoodPresetAction(payload);
        toast({ title: "Preset created" });
      }
      onSaved(result);
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save preset.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const hasSearchResults = userFoodResults.length > 0 || foundationResults.length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingPreset ? "Edit Preset" : "Create Preset"}</DialogTitle>
            <DialogDescription>
              {editingPreset ? "Update your preset name or items." : "Name your preset and add foods to it."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-1">
            <div className="space-y-1">
              <Label>Preset Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "Breakfast Burrito"'
                className="h-9"
              />
            </div>

            {items.length > 0 && (
              <div className="space-y-1.5">
                <Label>Items ({items.length})</Label>
                {items.map((item, idx) => (
                  <div key={item.localId} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.snapshotName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        disabled={item.servings <= 0.25}
                        onClick={() => {
                          const s = Math.max(0.25, item.servings - 0.5);
                          setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, servings: s } : it)));
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs w-6 text-center">{item.servings}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          const s = item.servings + 0.5;
                          setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, servings: s } : it)));
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Add Foods</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search foods to add..."
                  className="pl-9 h-9"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {isSearching && (
                <ScrollArea className="max-h-48">
                  <div className="space-y-1 pr-2">
                    {!searching && !hasSearchResults && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No results for &quot;{query}&quot;
                      </p>
                    )}
                    {userFoodResults.map((food) => (
                      <FoodResultCard
                        key={food.id}
                        name={food.name}
                        subtitle={food.brand ?? `${food.servingSize}${food.servingUnit}`}
                        calories={food.nutrients.calories}
                        onClick={() => {
                          setSelectedFood({ type: "complex", data: food });
                          setDetailOpen(true);
                        }}
                      />
                    ))}
                    {foundationResults.map((food) => (
                      <FoodResultCard
                        key={food.id}
                        name={food.name}
                        subtitle={food.category ?? "per 100g"}
                        calories={food.nutrients.calories}
                        onClick={() => {
                          setSelectedFood({ type: "foundation", data: food });
                          setDetailOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={submitting || !name.trim() || items.length === 0}
            >
              {submitting ? "Saving..." : editingPreset ? "Save Changes" : "Create Preset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FoodDetailDialog
        food={selectedFood}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddItem={handleAddItem}
      />
    </>
  );
}
