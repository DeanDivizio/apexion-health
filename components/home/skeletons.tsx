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
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Bone className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Bone className="h-3 w-16" />
              <Bone className="h-3 w-28" />
            </div>
            <Bone className="h-2.5 w-full rounded-full" />
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
        <RingSkeleton key={i} />
      ))}
    </div>
  );
}

export function HydrationSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Bone className="h-5 w-44" />
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}

export function MicroNutrientSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <Bone className="h-5 w-32" />
          <Bone className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Bone className="h-3 w-24" />
            <Bone className="h-3 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function WorkoutSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Bone className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Bone className="h-3 w-20" />
        <Bone className="h-4 w-44" />
        <Bone className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function MedsSummarySkeleton() {
  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <Bone className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Bone className="h-3 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-4 w-48" />
        ))}
      </CardContent>
    </Card>
  );
}
