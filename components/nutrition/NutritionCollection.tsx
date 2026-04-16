"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_primitives/tabs";
import { MealsList } from "./MealsList";
import { PresetsList } from "./PresetsList";
import { UserFoodsList } from "./UserFoodsList";
import type { FoodPresetView, NutritionMealSessionView, NutritionUserFoodView } from "@/lib/nutrition";

interface NutritionCollectionProps {
  initialSessions: NutritionMealSessionView[];
  initialPresets: FoodPresetView[];
  initialUserFoods: NutritionUserFoodView[];
}

export function NutritionCollection({ initialSessions, initialPresets, initialUserFoods }: NutritionCollectionProps) {
  return (
    <div className="px-4 pt-24 md:pt-6 pb-20 md:pb-0 md:h-full md:flex md:flex-col md:overflow-hidden">
      <h1 className="text-2xl font-semibold mb-6 shrink-0">Nutrition</h1>

      {/* Mobile: tabs */}
      <div className="xl:hidden max-w-2xl mx-auto">
        <Tabs defaultValue="meals">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="my-foods">My Foods</TabsTrigger>
          </TabsList>
          <TabsContent value="meals" className="mt-4">
            <MealsList initialSessions={initialSessions} />
          </TabsContent>
          <TabsContent value="presets" className="mt-4">
            <PresetsList initialPresets={initialPresets} />
          </TabsContent>
          <TabsContent value="my-foods" className="mt-4">
            <UserFoodsList initialUserFoods={initialUserFoods} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: three scrollable columns */}
      <div className="hidden xl:grid xl:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 shrink-0">Meals</h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <MealsList initialSessions={initialSessions} />
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 shrink-0">Presets</h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <PresetsList initialPresets={initialPresets} />
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 shrink-0">My Foods</h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <UserFoodsList initialUserFoods={initialUserFoods} />
          </div>
        </div>
      </div>
    </div>
  );
}
