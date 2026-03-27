"use client";

import { useEffect, useState } from "react";
import { getTodayBiometrics } from "@/actions/biometrics";
import Link from "next/link";
import { Activity } from "lucide-react";

interface TodayBio {
  dateStr: string;
  isToday: boolean;
  recoveryScore: number | null;
  restingHeartRate: number | null;
  hrvRmssdMilli: number | null;
  sleepDurationMilli: number | null;
  sleepPerformancePct: number | null;
}

function recoveryColor(score: number): string {
  if (score >= 67) return "text-green-400";
  if (score >= 34) return "text-yellow-400";
  return "text-red-400";
}

function formatSleep(milli: number): string {
  const mins = Math.round(milli / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function BiometricsSummary() {
  const [bio, setBio] = useState<TodayBio | null | undefined>(undefined);

  useEffect(() => {
    getTodayBiometrics()
      .then(setBio)
      .catch(() => setBio(null));
  }, []);

  // Still loading
  if (bio === undefined) return null;

  // No connection or no data
  if (bio === null) {
    return (
      <div className="hidden" />
    );
  }

  const label = bio.isToday ? "Today" : "Yesterday";

  return (
    <Link
      href="/biometrics"
      className="mt-4 rounded-xl border border-white/10 bg-neutral-900/40 p-4 block transition-colors hover:bg-neutral-800/50"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500">{label}&apos;s Biometrics</span>
        <Activity className="h-3.5 w-3.5 text-neutral-600" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {bio.recoveryScore != null && (
          <div>
            <p className="text-[10px] text-neutral-500">Recovery</p>
            <p className={`text-lg font-light ${recoveryColor(bio.recoveryScore)}`}>
              {Math.round(bio.recoveryScore)}%
            </p>
          </div>
        )}
        {bio.hrvRmssdMilli != null && (
          <div>
            <p className="text-[10px] text-neutral-500">HRV</p>
            <p className="text-lg font-light text-neutral-100">
              {bio.hrvRmssdMilli.toFixed(0)}
              <span className="text-xs text-neutral-500"> ms</span>
            </p>
          </div>
        )}
        {bio.restingHeartRate != null && (
          <div>
            <p className="text-[10px] text-neutral-500">RHR</p>
            <p className="text-lg font-light text-neutral-100">
              {Math.round(bio.restingHeartRate)}
              <span className="text-xs text-neutral-500"> bpm</span>
            </p>
          </div>
        )}
        {bio.sleepDurationMilli != null && (
          <div>
            <p className="text-[10px] text-neutral-500">Sleep</p>
            <p className="text-lg font-light text-neutral-100">
              {formatSleep(bio.sleepDurationMilli)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
