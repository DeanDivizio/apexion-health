import { Card, CardContent, CardHeader } from "@/components/ui_primitives/card";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-neutral-700/60 relative overflow-hidden",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_ease-in-out_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-neutral-500/15 after:to-transparent",
        className,
      )}
    />
  );
}

function RingSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col items-center w-full mb-4 rounded-xl bg-neutral-900/40 border-neutral-700/40", className)}>
      <CardHeader className="items-center w-full pb-2">
        <Bone className="h-4 w-20" />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-4">
        <div className="relative flex items-center justify-center">
          <div className="w-[120px] h-[120px] md:w-[180px] md:h-[180px] rounded-full border-[10px] md:border-[14px] border-neutral-700/50 relative overflow-hidden after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_ease-in-out_infinite] after:bg-gradient-to-r after:from-transparent after:via-neutral-500/15 after:to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Bone className="h-6 w-12 md:h-8 md:w-16" />
            <Bone className="h-3 w-10 md:h-3 md:w-12" />
          </div>
        </div>
        <Bone className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function MacroSummarySkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <Bone className="h-3 w-28" />
        <Bone className="h-3.5 w-3.5 rounded" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Bone className="h-3 w-16" />
              <Bone className="h-3 w-28" />
            </div>
            <Bone className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MacroRingChartsSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-around mb-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <RingSkeleton key={i} />
      ))}
    </div>
  );
}

export function HydrationSummarySkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <Bone className="h-3 w-40" />
        <Bone className="h-3.5 w-3.5 rounded" />
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Bone className="h-3 w-12" />
            <Bone className="h-3 w-20" />
          </div>
          <Bone className="h-2.5 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1.5">
              <Bone className="h-3 w-14 mx-auto" />
              <Bone className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MicroNutrientSummarySkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <Bone className="h-3 w-28" />
        <div className="flex items-center gap-2 shrink-0">
          <Bone className="h-3 w-20" />
          <Bone className="h-3.5 w-3.5 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Bone className="h-3 w-24" />
            <Bone className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkoutSummarySkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <Bone className="h-3 w-32" />
        <Bone className="h-3.5 w-3.5 rounded" />
      </div>
      <div className="space-y-3">
        <Bone className="h-3 w-20" />
        <Bone className="h-4 w-44" />
        <Bone className="h-3 w-32" />
      </div>
    </div>
  );
}

export function MedsSummarySkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <Bone className="h-3 w-36" />
        <Bone className="h-3.5 w-3.5 rounded" />
      </div>
      <div className="space-y-3">
        <Bone className="h-3 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-4 w-48" />
        ))}
      </div>
    </div>
  );
}
