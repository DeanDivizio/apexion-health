import { listFoodPresetsAction, listMealSessionsAction } from "@/actions/nutrition";
import { NutritionCollection } from "@/components/nutrition/NutritionCollection";

export default async function MealsPage() {
  const [sessions, presets] = await Promise.all([
    listMealSessionsAction(),
    listFoodPresetsAction(),
  ]);
  return <NutritionCollection initialSessions={sessions} initialPresets={presets} />;
}
