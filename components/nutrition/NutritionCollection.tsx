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
    <div className="max-w-2xl mx-auto px-4 pt-24 md:pt-6 pb-20 space-y-6">
      <h1 className="text-2xl font-semibold">Nutrition</h1>
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
  );
}
