"use client";

import React, { useState, useEffect, useContext, Suspense, useCallback } from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { getUserGoalsAction, getTodayMacroTotalsAction } from "@/actions/nutrition";
import { getUserHomePreferencesAction } from "@/actions/settings";
import { getHydrationSummaryAction } from "@/actions/hydration";
import { getMicroNutrientSummaryAction } from "@/actions/nutrition";
import { getWorkoutDaySummaryAction } from "@/actions/gym";
import { getMedsDaySummaryAction } from "@/actions/medication";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { WeeklyDataDisplayComponent } from "@/components/home/WeeklySummary";
import Footer from "@/components/global/Footer";
import Defocuser from "@/components/global/Defocuser";
import type { SummaryData } from "@/utils/types";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { SideNav } from "@/components/global/SideNav";
import { MacroSummarySmall } from "@/components/home/MacroSummarySmall";
import { HydrationSummary } from "@/components/home/HydrationSummary";
import { MicroNutrientSummary } from "@/components/home/MicroNutrientSummary";
import { WorkoutSummary } from "@/components/home/WorkoutSummary";
import { MedsSummary } from "@/components/home/MedsSummary";
import {
  MacroSummarySkeleton,
  MacroRingChartsSkeleton,
  HydrationSummarySkeleton,
  MicroNutrientSummarySkeleton,
  WorkoutSummarySkeleton,
  MedsSummarySkeleton,
} from "@/components/home/skeletons";
import type { UserHomePreferencesView } from "@/lib/settings/server/settingsService";
import type { HydrationSummaryView } from "@/actions/hydration";
import type { WorkoutDaySummarySession } from "@/lib/gym/server/gymService";
import type { MedsDaySummarySession } from "@/lib/medication/server/medicationService";
import type { MicroNutrientEntry } from "@/lib/nutrition/server/nutritionService";
import dynamic from "next/dynamic";
import { toCompactDateStr } from "@/lib/dates/dateStr";
import { Skeleton } from "@/components/ui_primitives/skeleton";

const MacroRingChartsGrid = dynamic(
  () =>
    import("@/components/home/MacroRingChartsGrid").then((m) => m.MacroRingChartsGrid),
  {
    ssr: false,
    loading: () => <MacroRingChartsSkeleton />,
  },
);

const BiometricsSummary = dynamic(
  () => import("@/components/home/BiometricsSummary").then((m) => m.BiometricsSummary),
  { ssr: false },
);

function getTodayDateStrCompact(): string {
  return toCompactDateStr(new Date());
}

const VISIBILITY_KEYS: Record<string, keyof UserHomePreferencesView> = {
  macroSummary: "showMacroSummary",
  hydrationSummary: "showHydrationSummary",
  workoutSummary: "showWorkoutSummary",
  medsSummary: "showMedsSummary",
  microNutrientSummary: "showMicroNutrientSummary",
};

const SKELETON_MAP: Record<string, React.FC> = {
  macroSummary: MacroSummarySkeleton,
  hydrationSummary: HydrationSummarySkeleton,
  workoutSummary: WorkoutSummarySkeleton,
  medsSummary: MedsSummarySkeleton,
  microNutrientSummary: MicroNutrientSummarySkeleton,
};

export default function Home() {
  const { setHeaderComponentLeft, setHeaderComponentRight, setMobileHeading } = useContext(MobileHeaderContext);
  const [data, setData] = useState<SummaryData>();
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [calorieLimit, setCalorieLimit] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);

  const [preferences, setPreferences] = useState<UserHomePreferencesView | null>(null);
  const [macrosReady, setMacrosReady] = useState(false);
  const [hydrationData, setHydrationData] = useState<HydrationSummaryView | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutDaySummarySession[] | null>(null);
  const [medsData, setMedsData] = useState<MedsDaySummarySession[] | null>(null);
  const [microData, setMicroData] = useState<MicroNutrientEntry[] | null>(null);

  const dataFetch = useCallback(async (silent = false) => {
    const endDate = getTodayDateStrCompact();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startDate = toCompactDateStr(oneWeekAgo);
    const todayDateStr = endDate;

    if (!silent) {
      setWeeklyLoading(true);
      setMacrosReady(false);
    }

    try {
      // 1) Critical path: today’s macros + goals first (bundle-dynamic-imports: one chart chunk after this resolves)
      const [macroTodayResult, goalsResult] = await Promise.allSettled([
        getTodayMacroTotalsAction(todayDateStr),
        getUserGoalsAction(),
      ]);

      if (macroTodayResult.status === "fulfilled") {
        const m = macroTodayResult.value;
        setTodayCalories(m.calories);
        setTodayProtein(m.protein);
        setTodayCarbs(m.carbs);
        setTodayFat(m.fat);
      } else {
        console.error(macroTodayResult.reason);
      }

      if (goalsResult.status === "fulfilled" && goalsResult.value) {
        const g = goalsResult.value;
        setCalorieLimit(g.calories ?? 0);
        setProteinGoal(g.protein ?? 0);
        setCarbGoal(g.carbs ?? 0);
        setFatGoal(g.fat ?? 0);
      }

      setMacrosReady(true);

      // 2) Secondary cards — parallel (async-parallel / defer-await pattern: macros are not blocked by these)
      const [prefs, hydration, workout, meds, micro] = await Promise.allSettled([
        getUserHomePreferencesAction(),
        getHydrationSummaryAction(todayDateStr),
        getWorkoutDaySummaryAction(todayDateStr),
        getMedsDaySummaryAction(todayDateStr),
        getMicroNutrientSummaryAction(todayDateStr),
      ]);

      if (prefs.status === "fulfilled") setPreferences(prefs.value);
      if (hydration.status === "fulfilled") setHydrationData(hydration.value);
      if (workout.status === "fulfilled") setWorkoutData(workout.value);
      if (meds.status === "fulfilled") setMedsData(meds.value);
      if (micro.status === "fulfilled") setMicroData(micro.value);

      // 3) Recent days (7d) — fires last; does not block macro hero or secondary cards above
      void homeFetch({ startDate, endDate })
        .then((summary) => {
          // @ts-ignore
          setData(summary as SummaryData);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          if (!silent) {
            setWeeklyLoading(false);
          }
        });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    dataFetch();
  }, [dataFetch]);

  useEffect(() => {
    function refreshOnReturn() {
      void dataFetch(true);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshOnReturn();
      }
    }

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [dataFetch]);

  useEffect(() => {
    setHeaderComponentLeft(<SideNav />);
    setHeaderComponentRight(
      <div className="flex items-center justify-center">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </div>,
    );
    setMobileHeading("generic");
  }, [setHeaderComponentLeft, setHeaderComponentRight, setMobileHeading]);

  function renderComponent(key: string) {
    switch (key) {
      case "macroSummary": {
        if (preferences?.macroSummarySize === "small") {
          return (
            <MacroSummarySmall
              calories={todayCalories}
              protein={todayProtein}
              carbs={todayCarbs}
              fat={todayFat}
              calorieGoal={calorieLimit}
              proteinGoal={proteinGoal}
              carbGoal={carbGoal}
              fatGoal={fatGoal}
            />
          );
        }
        return (
          <MacroRingChartsGrid
            todayCalories={todayCalories}
            todayProtein={todayProtein}
            todayCarbs={todayCarbs}
            todayFat={todayFat}
            calorieGoal={calorieLimit}
            proteinGoal={proteinGoal}
            carbGoal={carbGoal}
            fatGoal={fatGoal}
          />
        );
      }
      case "hydrationSummary":
        if (!hydrationData) return null;
        return <HydrationSummary {...hydrationData} />;
      case "workoutSummary":
        if (!workoutData) return null;
        return <WorkoutSummary sessions={workoutData} />;
      case "medsSummary":
        if (!medsData) return null;
        return <MedsSummary sessions={medsData} />;
      case "microNutrientSummary":
        if (!microData) return null;
        return <MicroNutrientSummary nutrients={microData} />;
      default:
        return null;
    }
  }

  function renderSkeletonForKey(key: string) {
    if (key === "macroSummary" && preferences?.macroSummarySize !== "small") {
      return <MacroRingChartsSkeleton />;
    }
    const SkeletonComponent = SKELETON_MAP[key];
    return SkeletonComponent ? <SkeletonComponent /> : null;
  }

  const componentOrder = preferences?.componentOrder ?? [
    "macroSummary",
    "hydrationSummary",
    "workoutSummary",
    "medsSummary",
    "microNutrientSummary",
  ];

  return (
    <main className="flex pb-12 md:pb-0 px-4 pt-24 md:pt-4 h-auto 3xl:h-[100vh] overflow-clip w-full flex-col items-center justify-start bg-gradient-to-br from-blue-950/20 to-neutral-950">
      <Defocuser />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full xl:h-[95vh]">
        <div className="col-span-1 order-2 xl:order-1 flex flex-col items-center lg:items-start p-4 border-2 bg-neutral-800/50 backdrop-blur-xl rounded-xl overflow-y-scroll">
          <h3 className="text-5xl w-full font-regular tracking-normal mt-4 xl:mt-0 mb-8 text-center">Recent Days</h3>
          {data ? (
            // @ts-ignore
            <WeeklyDataDisplayComponent isLoading={weeklyLoading} data={data} />
          ) : weeklyLoading ? (
            <Skeleton className="w-full bg-neutral-800 h-32 mb-4" />
          ) : null}
        </div>
        <div className="col-span-1 xl:col-span-2 order-1 xl:order-2 xl:h-[95vh] overflow-y-scroll xl:p-4 rounded-xl backdrop-blur-xl">
          <div className="space-y-4">
            {componentOrder.map((key) => {
              const visKey = VISIBILITY_KEYS[key];
              const isVisible = visKey
                ? (preferences?.[visKey] as boolean) ?? true
                : true;
              if (!isVisible) return null;

              const isDataLoaded =
                key === "macroSummary"
                  ? macrosReady
                  : key === "hydrationSummary"
                    ? hydrationData !== null
                    : key === "workoutSummary"
                      ? workoutData !== null
                      : key === "medsSummary"
                        ? medsData !== null
                        : key === "microNutrientSummary"
                          ? microData !== null
                          : true;

              return (
                <Suspense
                  key={key}
                  fallback={renderSkeletonForKey(key)}
                >
                  {isDataLoaded
                    ? renderComponent(key)
                    : renderSkeletonForKey(key)}
                </Suspense>
              );
            })}
          </div>

          <BiometricsSummary />
        </div>
      </div>
      <Footer />
    </main>
  );
}
