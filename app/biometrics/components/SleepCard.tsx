import type { BiometricDaySummary } from "@/actions/biometrics";
import { formatMilliToHoursMinutes, formatMilliToMinutes } from "./helpers";

interface SleepCardProps {
  sleeps: BiometricDaySummary["sleep"];
}

function SleepStageBar({ sleep }: { sleep: BiometricDaySummary["sleep"][0] }) {
  const light = sleep.totalLightSleepTimeMilli ?? 0;
  const deep = sleep.totalDeepSleepTimeMilli ?? 0;
  const rem = sleep.totalRemSleepTimeMilli ?? 0;
  const awake = sleep.totalAwakeTimeMilli ?? 0;
  const total = light + deep + rem + awake;

  if (total === 0) return null;

  const pct = (v: number) => `${((v / total) * 100).toFixed(1)}%`;

  return (
    <div className="mt-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div className="bg-blue-400" style={{ width: pct(light) }} />
        <div className="bg-blue-700" style={{ width: pct(deep) }} />
        <div className="bg-purple-500" style={{ width: pct(rem) }} />
        <div className="bg-neutral-600" style={{ width: pct(awake) }} />
      </div>
      <div className="mt-1.5 flex gap-3 text-[10px] text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
          Light {formatMilliToMinutes(light)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-700" />
          Deep {formatMilliToMinutes(deep)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
          REM {formatMilliToMinutes(rem)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-neutral-600" />
          Awake {formatMilliToMinutes(awake)}
        </span>
      </div>
    </div>
  );
}

export function SleepCard({ sleeps }: SleepCardProps) {
  const primarySleep = sleeps.find((s) => !s.nap);
  const naps = sleeps.filter((s) => s.nap);

  if (!primarySleep) return null;

  const totalSleepMilli =
    (primarySleep.totalLightSleepTimeMilli ?? 0) +
    (primarySleep.totalDeepSleepTimeMilli ?? 0) +
    (primarySleep.totalRemSleepTimeMilli ?? 0);

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-300">Sleep</h4>
        {primarySleep.sleepPerformancePct != null && (
          <span className="text-xs text-neutral-500">
            {Math.round(primarySleep.sleepPerformancePct)}% performance
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-light text-neutral-100">
          {formatMilliToHoursMinutes(totalSleepMilli)}
        </span>
        <span className="text-xs text-neutral-500">total sleep</span>
      </div>

      <SleepStageBar sleep={primarySleep} />

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {primarySleep.respiratoryRate != null && (
          <div>
            <p className="text-neutral-500">Resp. Rate</p>
            <p className="text-neutral-200">
              {primarySleep.respiratoryRate.toFixed(1)} bpm
            </p>
          </div>
        )}
        {primarySleep.sleepEfficiencyPct != null && (
          <div>
            <p className="text-neutral-500">Efficiency</p>
            <p className="text-neutral-200">
              {Math.round(primarySleep.sleepEfficiencyPct)}%
            </p>
          </div>
        )}
        {primarySleep.disturbanceCount != null && (
          <div>
            <p className="text-neutral-500">Disturbances</p>
            <p className="text-neutral-200">{primarySleep.disturbanceCount}</p>
          </div>
        )}
      </div>

      {naps.length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-2">
          <p className="text-xs text-neutral-500">
            {naps.length} nap{naps.length > 1 ? "s" : ""} —{" "}
            {naps
              .map((n) => {
                const dur =
                  (n.totalLightSleepTimeMilli ?? 0) +
                  (n.totalDeepSleepTimeMilli ?? 0) +
                  (n.totalRemSleepTimeMilli ?? 0);
                return formatMilliToHoursMinutes(dur);
              })
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
