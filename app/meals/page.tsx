import { listFoodPresetsAction, listMealSessionsAction, listUserFoodsAction } from "@/actions/nutrition";
import { NutritionCollection } from "@/components/nutrition/NutritionCollection";

export default async function MealsPage() {
  const [sessions, presets, userFoods] = await Promise.all([
    listMealSessionsAction(),
    listFoodPresetsAction(),
    listUserFoodsAction(),
  ]);
  return (
    <NutritionCollection
      initialSessions={sessions}
      initialPresets={presets}
      initialUserFoods={userFoods}
    />
  );
}
