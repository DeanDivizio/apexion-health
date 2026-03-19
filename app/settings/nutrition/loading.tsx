import { Skeleton } from "@/components/ui_primitives/skeleton";

export default function NutritionSettingsLoading() {
  return (
    <div className="w-full max-w-lg space-y-6">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-52 rounded-xl" />
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  );
}
