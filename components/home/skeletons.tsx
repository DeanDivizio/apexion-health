import { Skeleton } from "@/components/ui_primitives/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui_primitives/card";

export function MacroSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MacroRingChartsSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-around mb-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-full h-[240px] rounded-xl bg-neutral-900/30 animate-pulse" />
      ))}
    </div>
  );
}

export function HydrationSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-3 w-14 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MicroNutrientSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function WorkoutSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

export function MedsSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-14" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-44" />
        ))}
      </CardContent>
    </Card>
  );
}
