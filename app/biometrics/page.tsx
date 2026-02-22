"use client";

import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { SideNav } from "@/components/global/SideNav";
import { Skeleton } from "@/components/ui_primitives/skeleton";
import { getProviderConnection } from "@/actions/providers";
import {
  getBiometricDays,
  type BiometricDaySummary,
} from "@/actions/biometrics";
import { DayGroup } from "./components/DayGroup";
import { useSyncStatus } from "@/context/SyncStatusContext";
import Link from "next/link";

export default function BiometricsPage() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected") === "true";

  const { setMobileHeading, setHeaderComponentLeft, setHeaderComponentRight } =
    useContext(MobileHeaderContext);
  const { setSyncing: setGlobalSyncing } = useSyncStatus();

  const [days, setDays] = useState<BiometricDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setMobileHeading("Biometrics");
    setHeaderComponentLeft(<SideNav />);
    setHeaderComponentRight(<div />);
    return () => {
      setMobileHeading("");
      setHeaderComponentLeft(<div />);
      setHeaderComponentRight(<div />);
    };
  }, [setMobileHeading, setHeaderComponentLeft, setHeaderComponentRight]);

  useEffect(() => {
    async function load() {
      try {
        const conn = await getProviderConnection("whoop");
        if (!conn) {
          setConnected(false);
          setLoading(false);
          return;
        }

        setConnected(true);
        if (conn.status === "ERROR" || conn.status === "EXPIRED") {
          setConnectionError(
            conn.errorMessage ?? "Connection needs attention.",
          );
        }

        // If just connected, trigger initial backfill
        if (justConnected) {
          setSyncing(true);
          setGlobalSyncing(true);
          fetch("/api/sync/whoop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullBackfill: true }),
          })
            .then(() => getBiometricDays())
            .then(setDays)
            .catch(console.error)
            .finally(() => {
              setSyncing(false);
              setGlobalSyncing(false);
            });
        }

        const data = await getBiometricDays();
        setDays(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [justConnected]);

  if (loading) {
    return (
      <main className="w-full min-h-screen pt-20 px-4 pb-16">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="w-full h-[200px] rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  if (connected === false) {
    return (
      <main className="w-full min-h-screen pt-20 px-4 pb-16 flex flex-col items-center justify-center">
        <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-center mb-4">
          No biometric provider connected.
        </p>
        <Link
          href="/connect/whoop"
          className="rounded-xl bg-gradient-to-r from-green-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white"
        >
          Connect Whoop
        </Link>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen pt-20 pb-24 bg-gradient-to-b from-background to-background">
      <div className="max-w-lg mx-auto px-2">
        {connectionError && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-300">
            {connectionError}{" "}
            <Link
              href="/connect/whoop"
              className="underline underline-offset-2"
            >
              Reconnect
            </Link>
          </div>
        )}

        {syncing && (
          <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-950/20 px-4 py-3 text-sm text-blue-300 flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            Syncing data from Whoop...
          </div>
        )}

        {days.length === 0 && !syncing ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <Activity className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              No biometric data yet. Data will appear as Whoop syncs.
            </p>
          </div>
        ) : (
          days.map((day) => <DayGroup key={day.dateStr} day={day} />)
        )}
      </div>
    </main>
  );
}
