"use client";

import * as React from "react";
import { Camera, PlusCircle, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { FoodResultCard } from "./FoodResultCard";
import { FoodDetailDialog } from "./FoodDetailDialog";
import { ManualFoodForm } from "./ManualFoodForm";
import { LabelScanner } from "./LabelScanner";
import { searchFoodsAction } from "@/actions/nutrition";
import type {
  FoundationFoodView,
  MealItemDraft,
  NutritionUserFoodView,
} from "@/lib/nutrition";

interface FoodSearchProps {
  userFoods: NutritionUserFoodView[];
  onAddItem: (item: MealItemDraft) => void;
  onUserFoodCreated: (food: NutritionUserFoodView) => void;
}

type SelectedFood =
  | { type: "foundation"; data: FoundationFoodView }
  | { type: "complex"; data: NutritionUserFoodView };

export function FoodSearch({ userFoods, onAddItem, onUserFoodCreated }: FoodSearchProps) {
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [foundationResults, setFoundationResults] = React.useState<FoundationFoodView[]>([]);
  const [userFoodResults, setUserFoodResults] = React.useState<NutritionUserFoodView[]>([]);
  const [selectedFood, setSelectedFood] = React.useState<SelectedFood | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
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
  }, [query]);

  function handleSelectFoundation(food: FoundationFoodView) {
    setSelectedFood({ type: "foundation", data: food });
    setDetailOpen(true);
  }

  function handleSelectUserFood(food: NutritionUserFoodView) {
    setSelectedFood({ type: "complex", data: food });
    setDetailOpen(true);
  }

  const hasResults = userFoodResults.length > 0 || foundationResults.length > 0;

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods..."
          className="pl-9 h-10"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setScannerOpen(true)}>
          <Camera className="h-4 w-4" />
          Scan Label
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setManualOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Add Manually
        </Button>
      </div>

      {/* Results */}
      {query.trim().length >= 2 && !searching && !hasResults && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No results for &quot;{query}&quot;
        </p>
      )}

      {userFoodResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            My Foods ({userFoodResults.length})
          </p>
          {userFoodResults.map((food) => (
            <FoodResultCard
              key={food.id}
              name={food.name}
              subtitle={food.brand ?? `${food.servingSize}${food.servingUnit}`}
              calories={food.nutrients.calories}
              onClick={() => handleSelectUserFood(food)}
            />
          ))}
        </div>
      )}

      {foundationResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Foundation Foods ({foundationResults.length})
          </p>
          {foundationResults.map((food) => (
            <FoodResultCard
              key={food.id}
              name={food.name}
              subtitle={food.category ?? "per 100g"}
              calories={food.nutrients.calories}
              onClick={() => handleSelectFoundation(food)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <FoodDetailDialog
        food={selectedFood}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddItem={onAddItem}
      />

      <ManualFoodForm
        open={manualOpen}
        onOpenChange={setManualOpen}
        onAddItem={onAddItem}
        onUserFoodCreated={onUserFoodCreated}
      />

      <LabelScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onAddItem={onAddItem}
        onUserFoodCreated={onUserFoodCreated}
      />
    </div>
  );
}
