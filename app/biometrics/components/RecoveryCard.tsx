import type { BiometricDaySummary } from "@/actions/biometrics";
import { recoveryColor, recoveryBgColor } from "./helpers";

interface RecoveryCardProps {
  recovery: NonNullable<BiometricDaySummary["recovery"]>;
}

export function RecoveryCard({ recovery }: RecoveryCardProps) {
  const score = recovery.recoveryScore;

  return (
    <div
      className={`rounded-xl border p-4 ${
        score != null ? recoveryBgColor(score) : "border-white/10 bg-neutral-900/50"
      }`}
    >
      <h4 className="text-sm font-medium text-neutral-300">Recovery</h4>

      {score != null && (
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-3xl font-light ${recoveryColor(score)}`}>
            {Math.round(score)}%
          </span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        {recovery.restingHeartRate != null && (
          <div>
            <p className="text-neutral-400">Resting HR</p>
            <p className="text-neutral-100">
              {Math.round(recovery.restingHeartRate)} bpm
            </p>
          </div>
        )}
        {recovery.hrvRmssdMilli != null && (
          <div>
            <p className="text-neutral-400">HRV</p>
            <p className="text-neutral-100">
              {recovery.hrvRmssdMilli.toFixed(1)} ms
            </p>
          </div>
        )}
        {recovery.spo2Percentage != null && (
          <div>
            <p className="text-neutral-400">SpO2</p>
            <p className="text-neutral-100">
              {recovery.spo2Percentage.toFixed(1)}%
            </p>
          </div>
        )}
        {recovery.skinTempCelsius != null && (
          <div>
            <p className="text-neutral-400">Skin Temp</p>
            <p className="text-neutral-100">
              {recovery.skinTempCelsius.toFixed(1)}°C
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
