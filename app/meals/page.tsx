import { listMealSessionsAction } from "@/actions/nutrition";
import { MealsList } from "@/components/nutrition/MealsList";

export default async function MealsPage() {
  const sessions = await listMealSessionsAction();
  return <MealsList initialSessions={sessions} />;
}
