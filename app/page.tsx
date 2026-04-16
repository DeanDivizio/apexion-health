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
import {
  DEFAULT_CALORIES,
  DEFAULT_PROTEIN,
  DEFAULT_CARBS,
  DEFAULT_FAT,
} from "@/lib/nutrition/defaults";
import { getUserHomePreferencesAction } from "@/actions/settings";
import {
  getHydrationSummaryAction,
  type BeverageType,
  type HydrationSummaryView,
} from "@/actions/hydration";
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
import { ActivitySummary } from "@/components/home/ActivitySummary";
import {
  MacroSummarySkeleton,
  MacroRingChartsSkeleton,
  HydrationSummarySkeleton,
  MicroNutrientSummarySkeleton,
  WorkoutSummarySkeleton,
  MedsSummarySkeleton,
  ActivitySummarySkeleton,
} from "@/components/home/skeletons";
import type { UserHomePreferencesView } from "@/lib/settings/server/settingsService";
import type { WorkoutDaySummarySession } from "@/lib/gym/server/gymService";
import type { MedsDaySummarySession } from "@/lib/medication/server/medicationService";
import type { MicroNutrientEntry } from "@/lib/nutrition/server/nutritionService";
import type { ActivityContributionDay, ActivityLogView, ActivityTypeView } from "@/lib/activity";
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
import { CalendarDays, Settings } from "lucide-react";
import Link from "next/link";
import {
  getActivityBootstrapAction,
  getActivityContributionAction,
  listActivityTypesAction,
  listActivityLogsAction,
} from "@/actions/activity";
import { ActivityContributionGrid } from "@/components/activity/ActivityContributionGrid";
import { ActivityTrackerStrip } from "@/components/activity/ActivityTrackerStrip";

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
  activitySummary: "showActivitySummary",
};

const SKELETON_MAP: Record<string, React.FC> = {
  macroSummary: MacroSummarySkeleton,
  hydrationSummary: HydrationSummarySkeleton,
  workoutSummary: WorkoutSummarySkeleton,
  medsSummary: MedsSummarySkeleton,
  microNutrientSummary: MicroNutrientSummarySkeleton,
  activitySummary: ActivitySummarySkeleton,
};

const HYDRATION_LOGGED_EVENT = "hydration:logged";

function isBeverageType(value: unknown): value is BeverageType {
  return value === "water" || value === "coffee" || value === "tea";
}

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
  const [calorieLimit, setCalorieLimit] = useState(DEFAULT_CALORIES);
  const [proteinGoal, setProteinGoal] = useState(DEFAULT_PROTEIN);
  const [carbGoal, setCarbGoal] = useState(DEFAULT_CARBS);
  const [fatGoal, setFatGoal] = useState(DEFAULT_FAT);

  const [preferences, setPreferences] = useState<UserHomePreferencesView | null>(null);
  const [macrosReady, setMacrosReady] = useState(false);
  const [hydrationData, setHydrationData] = useState<HydrationSummaryView | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutDaySummarySession[] | null>(null);
  const [medsData, setMedsData] = useState<MedsDaySummarySession[] | null>(null);
  const [microData, setMicroData] = useState<MicroNutrientEntry[] | null>(null);
  const [activityTypesCount, setActivityTypesCount] = useState<number | null>(null);
  const [activityContribution, setActivityContribution] = useState<ActivityContributionDay[] | null>(null);
  const [activitySelectedDateStr, setActivitySelectedDateStr] = useState<string | null>(null);
  const [pinnedActivityTypes, setPinnedActivityTypes] = useState<ActivityTypeView[]>([]);
  const [pinnedActivityLogs, setPinnedActivityLogs] = useState<ActivityLogView[]>([]);
  const [homeCalendarMonth, setHomeCalendarMonth] = useState(() => new Date());
  const [homeCalendarContributions, setHomeCalendarContributions] = useState<ActivityContributionDay[] | null>(null);
  const fetchGenRef = useRef(0);
  const loadingGenRef = useRef(0);
  const lastFetchAtRef = useRef(0);

  const BACKGROUND_REFRESH_DEBOUNCE_MS = 30_000;

  const dataFetch = useCallback(async (silent = false) => {
    const now = Date.now();
    if (
      silent &&
      lastFetchAtRef.current > 0 &&
      now - lastFetchAtRef.current < BACKGROUND_REFRESH_DEBOUNCE_MS
    ) {
      console.log("[HOME] dataFetch skipped (silent debounce)");
      return;
    }

    const gen = ++fetchGenRef.current;
    lastFetchAtRef.current = now;
    const stale = () => gen !== fetchGenRef.current;
    const loadingGen = silent ? null : (loadingGenRef.current = gen);

    console.log(`[HOME] dataFetch START gen=${gen} silent=${silent} date=${selectedDateStr}`);

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
      setActivityTypesCount(null);
      setActivityContribution(null);
    }

    try {
      console.log(`[HOME] gen=${gen} fetching macros+goals...`);
      const [macroTodayResult, goalsResult] = await Promise.allSettled([
        getTodayMacroTotalsAction(todayDateStr),
        getUserGoalsAction(),
      ]);

      if (stale()) {
        console.log(`[HOME] gen=${gen} STALE after macros+goals, bailing`);
        return;
      }

      if (macroTodayResult.status === "fulfilled") {
        const m = macroTodayResult.value;
        console.log(`[HOME] gen=${gen} macros received:`, JSON.stringify(m));
        setTodayCalories(m.calories);
        setTodayProtein(m.protein);
        setTodayCarbs(m.carbs);
        setTodayFat(m.fat);
      } else {
        console.error(`[HOME] gen=${gen} macros REJECTED:`, macroTodayResult.reason);
      }

      if (goalsResult.status === "fulfilled" && goalsResult.value) {
        const g = goalsResult.value;
        setCalorieLimit(g.calories ?? DEFAULT_CALORIES);
        setProteinGoal(g.protein ?? DEFAULT_PROTEIN);
        setCarbGoal(g.carbs ?? DEFAULT_CARBS);
        setFatGoal(g.fat ?? DEFAULT_FAT);
      }

      setMacrosReady(true);

      console.log(`[HOME] gen=${gen} fetching secondary cards...`);
      const [prefs, hydration, workout, meds, micro] = await Promise.allSettled([
        getUserHomePreferencesAction(),
        getHydrationSummaryAction(todayDateStr, timezoneOffsetMinutes),
        getWorkoutDaySummaryAction(todayDateStr),
        getMedsDaySummaryAction(todayDateStr, timezoneOffsetMinutes),
        getMicroNutrientSummaryAction(todayDateStr),
      ]);

      if (stale()) {
        console.log(`[HOME] gen=${gen} STALE after secondary, bailing`);
        return;
      }

      if (prefs.status === "fulfilled") setPreferences(prefs.value);
      if (hydration.status === "fulfilled") {
        console.log(`[HOME] gen=${gen} hydration received:`, JSON.stringify(hydration.value));
        setHydrationData(hydration.value);
      }
      if (workout.status === "fulfilled") setWorkoutData(workout.value);
      if (meds.status === "fulfilled") setMedsData(meds.value);
      if (micro.status === "fulfilled") setMicroData(micro.value);

      void getActivityBootstrapAction()
        .then((bootstrap) => {
          if (stale()) return;
          setActivityTypesCount(bootstrap.activityTypes.length);
        })
        .catch((error) => {
          console.error("[HOME] activity bootstrap failed", error);
        });

      const monthDate = new Date(
        Number(selectedDateStr.slice(0, 4)),
        Number(selectedDateStr.slice(4, 6)) - 1,
        1,
      );
      const monthStart = toCompactDateStr(monthDate);
      const monthEnd = toCompactDateStr(
        new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
      );
      void getActivityContributionAction(monthStart, monthEnd)
        .then((rows) => {
          if (stale()) return;
          const nonZeroRows = rows.filter((entry) => entry.count > 0);
          setActivityContribution(nonZeroRows);
          setHomeCalendarContributions(rows);
          setActivitySelectedDateStr((current) =>
            current && nonZeroRows.some((entry) => entry.dateStr === current)
              ? current
              : null,
          );
        })
        .catch((error) => {
          console.error("[HOME] activity contribution failed", error);
        });

      const resolvedPrefs = prefs.status === "fulfilled" ? prefs.value : null;
      const hasPinnedItems =
        resolvedPrefs?.showActivityCalendar ||
        (resolvedPrefs?.pinnedActivityTypeIds?.length ?? 0) > 0;
      if (hasPinnedItems) {
        void Promise.allSettled([
          listActivityTypesAction(),
          listActivityLogsAction(),
        ]).then(([typesResult, logsResult]) => {
          if (stale()) return;
          if (typesResult.status === "fulfilled") {
            const pinnedIds = new Set(resolvedPrefs?.pinnedActivityTypeIds ?? []);
            setPinnedActivityTypes(
              typesResult.value.filter((t) => pinnedIds.has(t.id)),
            );
          }
          if (logsResult.status === "fulfilled") {
            setPinnedActivityLogs(logsResult.value);
          }
        });
      }

      console.log(`[HOME] gen=${gen} firing homeFetch...`);
      void homeFetch({ startDate, endDate, timezoneOffsetMinutes })
        .then((summary) => {
          if (stale()) return;
          // @ts-ignore
          setData(summary as SummaryData);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          if (loadingGen !== null && loadingGenRef.current === loadingGen) {
            setWeeklyLoading(false);
          }
        });
    } catch (err) {
      console.error(`[HOME] gen=${gen} ERROR:`, err);
    }
    console.log(`[HOME] gen=${gen} dataFetch END`);
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
    function onHydrationLogged(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as {
        amountOz?: unknown;
        beverageType?: unknown;
      };
      if (!detail) return;

      const amountOz =
        typeof detail.amountOz === "number" ? detail.amountOz : Number.NaN;
      if (!Number.isFinite(amountOz) || amountOz <= 0) return;
      if (!isBeverageType(detail.beverageType)) return;
      if (selectedDateStr !== getTodayDateStrCompact()) return;

      setHydrationData((current) => {
        if (!current) return current;
        if (detail.beverageType === "coffee") {
          return { ...current, coffeeOz: current.coffeeOz + amountOz };
        }
        if (detail.beverageType === "tea") {
          return { ...current, teaOz: current.teaOz + amountOz };
        }
        return { ...current, waterOz: current.waterOz + amountOz };
      });
    }

    window.addEventListener(HYDRATION_LOGGED_EVENT, onHydrationLogged);
    return () => {
      window.removeEventListener(HYDRATION_LOGGED_EVENT, onHydrationLogged);
    };
  }, [selectedDateStr]);

  useEffect(() => {
    setHeaderInnerLeft(
      <Link href="/settings">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-100">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
    );
    setHeaderInnerRight(null);
  }, [setHeaderInnerLeft, setHeaderInnerRight]);

  const handleHomeCalendarMonthChange = useCallback((newMonth: Date) => {
    setHomeCalendarMonth(newMonth);
    const first = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    const last = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0);
    void getActivityContributionAction(toCompactDateStr(first), toCompactDateStr(last))
      .then(setHomeCalendarContributions)
      .catch((err) => console.error("[HOME] calendar month fetch failed", err));
  }, []);

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
      case "activitySummary": {
        if (!activityContribution) return null;
        const showCalendar = preferences?.showActivityCalendar ?? false;
        const showCompact = preferences?.showActivityCompactSummary ?? true;
        const hasPinnedStrips = pinnedActivityTypes.length > 0;
        if (!showCalendar && !hasPinnedStrips) {
          return showCompact ? (
            <ActivitySummary
              contributions={activityContribution}
              activityTypesCount={activityTypesCount ?? 0}
            />
          ) : null;
        }
        return (
          <div className="space-y-3">
            {showCalendar && homeCalendarContributions && (
              <ActivityContributionGrid
                contributions={homeCalendarContributions}
                monthDate={homeCalendarMonth}
                selectedDateStr={null}
                onSelectDate={() => {}}
                onMonthChange={handleHomeCalendarMonthChange}
              />
            )}
            {showCompact && (
              <ActivitySummary
                contributions={activityContribution}
                activityTypesCount={activityTypesCount ?? 0}
              />
            )}
            {pinnedActivityTypes.map((type) => (
              <ActivityTrackerStrip
                key={type.id}
                type={type}
                logs={pinnedActivityLogs}
              />
            ))}
          </div>
        );
      }
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
    "activitySummary",
  ];
  const greeting = getGreetingForHour(new Date());
  const userFirstName = user?.firstName ?? "there";
  const selectedDate = compactDateStrToDate(selectedDateStr);
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : compactDateStrToIsoDate(selectedDateStr);

  return (
    <main className="flex pb-12 md:pb-0 px-4 pt-24 md:pt-4 h-auto md:h-full md:overflow-hidden w-full flex-col items-center justify-start bg-gradient-to-br from-blue-950/20 to-neutral-950">
      <Defocuser />
      {/* Desktop: coming soon */}
      <div className="hidden xl:flex flex-col items-center justify-center w-full flex-1 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-xl px-12 py-16 text-center max-w-lg">
          <h2 className="text-3xl font-light tracking-tight text-neutral-100 mb-3">
            Home Screen Coming Soon
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            We&apos;re building a new desktop dashboard experience. In the meantime, use the sidebar to navigate to your sections.
          </p>
        </div>
      </div>

      {/* Mobile: existing layout */}
      <div className="grid grid-cols-1 gap-8 w-full xl:hidden">
        <div className="col-span-1 overflow-y-scroll rounded-xl backdrop-blur-xl">
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
                          : key === "activitySummary"
                            ? activityContribution !== null
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
