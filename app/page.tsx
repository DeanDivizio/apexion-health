"use client";

import React, {
  useState,
  useEffect,
  useContext,
  Suspense,
  useCallback,
  useRef,
} from "react";
import { homeFetch } from "@/actions/InternalLogic";
import { getUserGoalsAction, getTodayMacroTotalsAction } from "@/actions/nutrition";
import { getUserHomePreferencesAction } from "@/actions/settings";
import { getHydrationSummaryAction } from "@/actions/hydration";
import { getMicroNutrientSummaryAction } from "@/actions/nutrition";
import { getWorkoutDaySummaryAction } from "@/actions/gym";
import { getMedsDaySummaryAction } from "@/actions/medication";
import { WeeklyDataDisplayComponent } from "@/components/home/WeeklySummary";
import Footer from "@/components/global/Footer";
import Defocuser from "@/components/global/Defocuser";
import type { SummaryData } from "@/utils/types";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
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
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui_primitives/button";
import { Calendar } from "@/components/ui_primitives/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import { CalendarDays } from "lucide-react";

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

function compactDateStrToIsoDate(compactDateStr: string): string {
  if (compactDateStr.length !== 8) return "";
  return `${compactDateStr.slice(0, 4)}-${compactDateStr.slice(4, 6)}-${compactDateStr.slice(6, 8)}`;
}

function compactDateStrToDate(compactDateStr: string): Date | null {
  if (compactDateStr.length !== 8) return null;
  const year = Number(compactDateStr.slice(0, 4));
  const month = Number(compactDateStr.slice(4, 6)) - 1;
  const day = Number(compactDateStr.slice(6, 8));
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getGreetingForHour(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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
  const { setHeaderInnerLeft, setHeaderInnerRight } = useContext(MobileHeaderContext);
  const { user } = useUser();
  const [data, setData] = useState<SummaryData>();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateStrCompact());
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
  const isFetchingRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const BACKGROUND_REFRESH_DEBOUNCE_MS = 30_000;

  const dataFetch = useCallback(async (silent = false) => {
    const now = Date.now();
    if (isFetchingRef.current) return;
    if (
      silent &&
      lastFetchAtRef.current > 0 &&
      now - lastFetchAtRef.current < BACKGROUND_REFRESH_DEBOUNCE_MS
    ) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    const endDate = selectedDateStr;
    const selectedDate = new Date(
      Number(selectedDateStr.slice(0, 4)),
      Number(selectedDateStr.slice(4, 6)) - 1,
      Number(selectedDateStr.slice(6, 8)),
    );
    const oneWeekAgo = new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDate = toCompactDateStr(oneWeekAgo);
    const todayDateStr = endDate;
    const timezoneOffsetMinutes = new Date().getTimezoneOffset();

    if (!silent) {
      setWeeklyLoading(true);
      setMacrosReady(false);
      setHydrationData(null);
      setWorkoutData(null);
      setMedsData(null);
      setMicroData(null);
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
        getHydrationSummaryAction(todayDateStr, timezoneOffsetMinutes),
        getWorkoutDaySummaryAction(todayDateStr),
        getMedsDaySummaryAction(todayDateStr, timezoneOffsetMinutes),
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
    } finally {
      isFetchingRef.current = false;
    }
  }, [BACKGROUND_REFRESH_DEBOUNCE_MS, selectedDateStr]);

  useEffect(() => {
    dataFetch();
  }, [dataFetch]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void dataFetch(true);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [dataFetch]);

  useEffect(() => {
    setHeaderInnerLeft(null);
    setHeaderInnerRight(null);
  }, [setHeaderInnerLeft, setHeaderInnerRight]);

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
  const greeting = getGreetingForHour(new Date());
  const userFirstName = user?.firstName ?? "there";
  const selectedDate = compactDateStrToDate(selectedDateStr);
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : compactDateStrToIsoDate(selectedDateStr);

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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-thin italic tracking-tight text-neutral-100">
                {greeting}, {userFirstName}
              </h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-xs font-thin italic text-neutral-300 hover:text-neutral-100"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {selectedDateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto border-neutral-800 bg-neutral-950/95 p-0"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate ?? undefined}
                    onSelect={(date) => {
                      if (!date) return;
                      setSelectedDateStr(toCompactDateStr(date));
                    }}
                    disabled={{ after: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
