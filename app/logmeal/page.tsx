import { getNutritionBootstrapAction } from "@/actions/nutrition";
import { NutritionFlow } from "@/components/nutrition/NutritionFlow";

export default async function LogMealPage() {
  const bootstrap = await getNutritionBootstrapAction();
  return <NutritionFlow bootstrap={bootstrap} />;
}
