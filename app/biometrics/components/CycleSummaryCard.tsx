import type { BiometricDaySummary } from "@/actions/biometrics";

interface CycleSummaryCardProps {
  cycle: NonNullable<BiometricDaySummary["cycle"]>;
}

export function CycleSummaryCard({ cycle }: CycleSummaryCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-4">
      <h4 className="text-sm font-medium text-neutral-300">Day Strain</h4>

      {cycle.strain != null && (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-light text-neutral-100">
            {cycle.strain.toFixed(1)}
          </span>
          <span className="text-xs text-neutral-500">strain</span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {cycle.kilojoule != null && (
          <div>
            <p className="text-neutral-500">Energy</p>
            <p className="text-neutral-200">
              {Math.round(cycle.kilojoule).toLocaleString()} kJ
            </p>
          </div>
        )}
        {cycle.averageHeartRate != null && (
          <div>
            <p className="text-neutral-500">Avg HR</p>
            <p className="text-neutral-200">{cycle.averageHeartRate} bpm</p>
          </div>
        )}
        {cycle.maxHeartRate != null && (
          <div>
            <p className="text-neutral-500">Max HR</p>
            <p className="text-neutral-200">{cycle.maxHeartRate} bpm</p>
          </div>
        )}
      </div>
    </div>
  );
}
