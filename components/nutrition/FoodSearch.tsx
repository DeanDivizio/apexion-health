"use client";

import * as React from "react";
import { Camera, EllipsisVertical, PlusCircle, Search, Loader2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_primitives/tabs";
import { FoodResultCard } from "./FoodResultCard";
import { FoodDetailDialog } from "./FoodDetailDialog";
import { ManualFoodForm } from "./ManualFoodForm";
import { LabelScanner } from "./LabelScanner";
import { PhotoEstimator } from "./PhotoEstimator";
import { PresetCard } from "./PresetCard";
import { searchFoodsAction } from "@/actions/nutrition";
import { useToast } from "@/hooks/use-toast";
import type {
  FoodPresetView,
  FoodPresetItemView,
  FoundationFoodView,
  MealItemDraft,
  NutrientProfile,
  NutritionUserFoodView,
  RecentFoodEntry,
} from "@/lib/nutrition";

interface FoodSearchProps {
  userFoods: NutritionUserFoodView[];
  recentFoods: RecentFoodEntry[];
  presets: FoodPresetView[];
  onAddItem: (item: MealItemDraft) => void;
  onAddPresetItems: (items: MealItemDraft[]) => void;
  onUserFoodCreated: (food: NutritionUserFoodView) => void;
}

type SelectedFood =
  | { type: "foundation"; data: FoundationFoodView }
  | { type: "complex"; data: NutritionUserFoodView };

function presetItemToDraft(item: FoodPresetItemView): MealItemDraft {
  return {
    localId: crypto.randomUUID(),
    foodSource: item.foodSource,
    sourceFoodId: item.sourceFoodId,
    foundationFoodId: item.foundationFoodId,
    snapshotName: item.snapshotName,
    snapshotBrand: item.snapshotBrand,
    servings: item.servings,
    portionLabel: item.portionLabel,
    portionGramWeight: item.portionGramWeight,
    nutrients: item.nutrients as NutrientProfile,
  };
}

export function FoodSearch({
  userFoods,
  recentFoods,
  presets,
  onAddItem,
  onAddPresetItems,
  onUserFoodCreated,
}: FoodSearchProps) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [foundationResults, setFoundationResults] = React.useState<FoundationFoodView[]>([]);
  const [userFoodResults, setUserFoodResults] = React.useState<NutritionUserFoodView[]>([]);
  const [selectedFood, setSelectedFood] = React.useState<SelectedFood | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [photoEstimatorOpen, setPhotoEstimatorOpen] = React.useState(false);
  const [browseTab, setBrowseTab] = React.useState<"presets" | "recents">(
    presets.length > 0 ? "presets" : "recents",
  );

  const isSearching = query.trim().length >= 2;
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isSearching) {
      setSearching(false);
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

  function handleUsePreset(preset: FoodPresetView) {
    const drafts = preset.items.map(presetItemToDraft);
    onAddPresetItems(drafts);
    toast({
      title: `${preset.name} (${drafts.length} item${drafts.length !== 1 ? "s" : ""}) added to meal`,
    });
  }

  const hasSearchResults = userFoodResults.length > 0 || foundationResults.length > 0;

  const matchingPresets = isSearching
    ? presets.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

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
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-green-500/40" onClick={() => setScannerOpen(true)}>
          <Camera className="h-4 w-4 text-green-400/90 mr-1" />
          Scan Label
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-amber-500/40" onClick={() => setPhotoEstimatorOpen(true)}>
          <Sparkles className="h-4 w-4 text-amber-400/90 mr-1" />
          Estimate with AI
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 max-w-fit gap-1">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setManualOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Manually
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="max-h-[calc(100dvh-16rem)]">
        <div className="space-y-4 pr-2 pb-36">
          {/* Browse mode: Presets / Recents tabs */}
          {!isSearching && (
            <Tabs value={browseTab} onValueChange={(v) => setBrowseTab(v as "presets" | "recents")}>
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
                <TabsTrigger value="recents" className="text-xs">Recents</TabsTrigger>
              </TabsList>

              <TabsContent value="presets" className="mt-3 space-y-2">
                {presets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No presets yet. Create one from the Meal Presets page or save one from a past meal.
                  </p>
                ) : (
                  presets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      onUse={() => handleUsePreset(preset)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="recents" className="mt-3 space-y-2">
                {recentFoods.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Search for a food or add one manually to get started.
                  </p>
                ) : (
                  recentFoods.map((entry) => {
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
                  })
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Search results: matching presets */}
          {isSearching && matchingPresets.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                My Presets ({matchingPresets.length})
              </p>
              {matchingPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onUse={() => handleUsePreset(preset)}
                />
              ))}
            </div>
          )}

          {/* Search results: user foods */}
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

          {/* Search results: foundation foods */}
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

          {/* Empty search state */}
          {isSearching && !searching && !hasSearchResults && matchingPresets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results for &quot;{query}&quot;
            </p>
          )}
        </div>
      </ScrollArea>

      <FoodDetailDialog
        food={selectedFood}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddItem={(item) => {
          onAddItem(item);
          setQuery("");
        }}
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

      <PhotoEstimator
        open={photoEstimatorOpen}
        onOpenChange={setPhotoEstimatorOpen}
        onAddItems={(items) => {
          onAddPresetItems(items);
          toast({
            title: `${items.length} estimated item${items.length !== 1 ? "s" : ""} added to meal`,
          });
        }}
      />
    </div>
  );
}
