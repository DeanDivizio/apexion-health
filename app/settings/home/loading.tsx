import { Skeleton } from "@/components/ui_primitives/skeleton";

export default function HomeSettingsLoading() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-4 w-48" />
      <div className="rounded-xl bg-neutral-800/50 p-3 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  );
}
