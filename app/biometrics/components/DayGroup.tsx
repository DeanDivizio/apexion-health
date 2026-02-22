import type { BiometricDaySummary } from "@/actions/biometrics";
import { SleepCard } from "./SleepCard";
import { RecoveryCard } from "./RecoveryCard";
import { CycleSummaryCard } from "./CycleSummaryCard";
import { formatDateStr } from "./helpers";

interface DayGroupProps {
  day: BiometricDaySummary;
}

export function DayGroup({ day }: DayGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-lg font-medium text-neutral-200">
        {formatDateStr(day.dateStr)}
      </h3>
      <div className="flex flex-col gap-3">
        {day.recovery && <RecoveryCard recovery={day.recovery} />}
        {day.sleep.length > 0 && <SleepCard sleeps={day.sleep} />}
        {day.cycle && <CycleSummaryCard cycle={day.cycle} />}
      </div>
    </div>
  );
}
