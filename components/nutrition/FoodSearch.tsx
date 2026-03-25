"use client";

import * as React from "react";
import { Camera, PlusCircle, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { FoodResultCard } from "./FoodResultCard";
import { FoodDetailDialog } from "./FoodDetailDialog";
import { ManualFoodForm } from "./ManualFoodForm";
import { LabelScanner } from "./LabelScanner";
import { searchFoodsAction } from "@/actions/nutrition";
import type {
  FoundationFoodView,
  MealItemDraft,
  NutritionUserFoodView,
  RecentFoodEntry,
} from "@/lib/nutrition";

interface FoodSearchProps {
  userFoods: NutritionUserFoodView[];
  recentFoods: RecentFoodEntry[];
  onAddItem: (item: MealItemDraft) => void;
  onUserFoodCreated: (food: NutritionUserFoodView) => void;
}

type SelectedFood =
  | { type: "foundation"; data: FoundationFoodView }
  | { type: "complex"; data: NutritionUserFoodView };

export function FoodSearch({ userFoods, recentFoods, onAddItem, onUserFoodCreated }: FoodSearchProps) {
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [foundationResults, setFoundationResults] = React.useState<FoundationFoodView[]>([]);
  const [userFoodResults, setUserFoodResults] = React.useState<NutritionUserFoodView[]>([]);
  const [selectedFood, setSelectedFood] = React.useState<SelectedFood | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const isSearching = query.trim().length >= 2;
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

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

  function handleSelectFoundation(food: FoundationFoodView) {
    setSelectedFood({ type: "foundation", data: food });
    setDetailOpen(true);
  }

  function handleSelectUserFood(food: NutritionUserFoodView) {
    setSelectedFood({ type: "complex", data: food });
    setDetailOpen(true);
  }

  function handleSelectRecent(entry: RecentFoodEntry) {
    setSelectedFood(entry);
    setDetailOpen(true);
  }

  const hasSearchResults = userFoodResults.length > 0 || foundationResults.length > 0;

  return (
    <div className="space-y-4">
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

      <ScrollArea className="max-h-[calc(100dvh-16rem)]">
        <div className="space-y-4 pr-2 pb-24">
          {/* Recents (shown when not actively searching) */}
          {!isSearching && recentFoods.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recently Logged
              </p>
              {recentFoods.map((entry) => {
                const key = entry.type === "foundation" ? `f-${entry.data.id}` : `u-${entry.data.id}`;
                const name = entry.data.name;
                const subtitle =
                  entry.type === "foundation"
                    ? (entry.data.category ?? "per 100g")
                    : (entry.data.brand ?? `${entry.data.servingSize}${entry.data.servingUnit}`);
                return (
                  <FoodResultCard
                    key={key}
                    name={name}
                    subtitle={subtitle}
                    calories={entry.data.nutrients.calories}
                    onClick={() => handleSelectRecent(entry)}
                  />
                );
              })}
            </div>
          )}

          {!isSearching && recentFoods.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Search for a food or add one manually to get started.
            </p>
          )}

          {/* Search results */}
          {isSearching && !searching && !hasSearchResults && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results for &quot;{query}&quot;
            </p>
          )}

          {isSearching && userFoodResults.length > 0 && (
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

          {isSearching && foundationResults.length > 0 && (
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
        </div>
      </ScrollArea>

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
