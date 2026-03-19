import { Skeleton } from "@/components/ui_primitives/skeleton";

export default function SettingsHubLoading() {
  return (
    <div className="w-full max-w-lg space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-4 px-5 rounded-xl bg-neutral-800/50"
        >
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      ))}
    </div>
  );
}
