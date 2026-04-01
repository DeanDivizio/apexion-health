"use client";

import * as React from "react";
import { useContext, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings2, ClipboardList } from "lucide-react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui_primitives/button";
import { captureClientEvent } from "@/lib/posthog-client";
import { AddExercise } from "./AddExercise";
import { ExerciseLogger } from "./ExerciseLogger";
import { ExerciseSettingsSheet } from "./ExerciseSettingsSheet";
import { SessionOverviewSheet } from "./SessionOverviewSheet";
import type { ExerciseGroupOption } from "./ExerciseCombobox";
import {
  createWorkoutSessionAction,
  createCustomExerciseAction,
  getExerciseDefaultsAction,
  getGymUserPreferencesAction,
} from "@/actions/gym";
import type {
  ExerciseEntry,
  ExerciseDefinition,
  GymUserMeta,
  RepInputStyle,
  StrengthSet,
  StrengthExerciseEntry,
  CreateCustomExerciseInput,
  CustomExerciseDefinition,
  ExerciseCategory,
  VariationPresetSummary,
} from "@/lib/gym";
import {
  EXERCISE_MAP,
  DEFAULT_EXERCISE_GROUPS,
  CATEGORY_DISPLAY_NAMES,
  exerciseStatsKey,
} from "@/lib/gym";

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------
const STORAGE_KEY = "apexion-workout-session";

interface PersistedState {
  view: "addExercise" | "logExercise";
  exercises: ExerciseEntry[];
  activeExerciseKey: string | null;
  activeSets: StrengthSet[];
  activeVariations: Record<string, string>;
  sessionDate: string; // ISO string
  startTime: string;
  endTime: string | null;
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable -- fail silently
  }
}

function clearPersistedState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
function formatTimeNow(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface WorkoutFlowProps {
  userMeta: GymUserMeta | null;
  customExerciseGroups: ExerciseGroupOption[];
  repInputStyle?: RepInputStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WorkoutFlow({ userMeta, customExerciseGroups, repInputStyle }: WorkoutFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    setHeaderInnerLeft,
    setHeaderInnerRight,
  } = useContext(MobileHeaderContext);

  // ---- State ----
  const [view, setView] = React.useState<"addExercise" | "logExercise">("addExercise");
  const [exercises, setExercises] = React.useState<ExerciseEntry[]>([]);
  const [activeExerciseKey, setActiveExerciseKey] = React.useState<string | null>(null);
  const [activeSets, setActiveSets] = React.useState<StrengthSet[]>([
    { weight: 0, reps: { bilateral: 0 } },
  ]);
  const [activeVariations, setActiveVariations] = React.useState<Record<string, string>>({});
  const [sessionDate, setSessionDate] = React.useState<Date>(new Date());
  const [startTime, setStartTime] = React.useState(formatTimeNow());
  const [endTime, setEndTime] = React.useState<string | null>(null); // null = "now"
  const [submitting, setSubmitting] = React.useState(false);

  // Overlay state
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [overviewOpen, setOverviewOpen] = React.useState(false);
  const [activePresetName, setActivePresetName] = React.useState<string | null>(null);
  const hasWarnedMissingExercise = React.useRef(false);

  // Rep input style -- seeded from server prop, refreshed client-side on mount
  // so navigating back from settings always picks up the latest value.
  const [liveRepInputStyle, setLiveRepInputStyle] = React.useState<RepInputStyle>(
    repInputStyle ?? "dropdown",
  );

  useEffect(() => {
    getGymUserPreferencesAction().then((data) => {
      const val = data?.repInputStyle;
      setLiveRepInputStyle(val === "freeform" ? "freeform" : "dropdown");
    }).catch(() => {});
  }, []);

  // ---- Restore from localStorage on mount ----
  const hasRestored = useRef(false);
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    const saved = loadPersistedState();
    if (saved) {
      setView(saved.view);
      setExercises(saved.exercises);
      setActiveExerciseKey(saved.activeExerciseKey);
      setActiveSets(saved.activeSets);
      setActiveVariations(saved.activeVariations);
      setSessionDate(new Date(saved.sessionDate));
      setStartTime(saved.startTime);
      setEndTime(saved.endTime);
    }
  }, []);

  // ---- Persist to localStorage on every change ----
  useEffect(() => {
    const hasStagedExercises = exercises.length > 0;
    const hasValidActiveSets =
      activeExerciseKey !== null &&
      activeSets.some(
        (s) =>
          s.weight > 0 &&
          ((s.reps.bilateral !== undefined && s.reps.bilateral > 0) ||
            ((s.reps.left ?? 0) > 0 && (s.reps.right ?? 0) > 0)),
      );

    if (!hasStagedExercises && !hasValidActiveSets) {
      clearPersistedState();
      return;
    }

    const state: PersistedState = {
      view,
      exercises,
      activeExerciseKey,
      activeSets,
      activeVariations,
      sessionDate: sessionDate.toISOString(),
      startTime,
      endTime,
    };
    savePersistedState(state);
  }, [view, exercises, activeExerciseKey, activeSets, activeVariations, sessionDate, startTime, endTime]);

  // ---- Derived ----
  const runtimeExerciseMap = useMemo(() => {
    const merged = new Map(EXERCISE_MAP);
    const customDefinitions = userMeta?.customExerciseDefinitions ?? {};
    for (const [key, definition] of Object.entries(customDefinitions)) {
      merged.set(key, definition);
    }
    return merged;
  }, [userMeta]);

  // Locally injected custom definitions (created this session, before server refresh)
  const [localCustomDefs, setLocalCustomDefs] = React.useState<
    Record<string, CustomExerciseDefinition>
  >({});

  // Locally injected presets (created this session, before server refresh)
  const [localPresets, setLocalPresets] = React.useState<VariationPresetSummary[]>([]);

  const effectiveExerciseMap = useMemo(() => {
    const merged = new Map(runtimeExerciseMap);
    for (const [key, def] of Object.entries(localCustomDefs)) {
      merged.set(key, def);
    }
    return merged;
  }, [runtimeExerciseMap, localCustomDefs]);

  const activeExercise: ExerciseDefinition | null = useMemo(() => {
    if (!activeExerciseKey) return null;
    return effectiveExerciseMap.get(activeExerciseKey) ?? null;
  }, [activeExerciseKey, effectiveExerciseMap]);

  const exerciseStats = useMemo(() => {
    if (!activeExerciseKey || !userMeta) return null;
    const sKey = exerciseStatsKey(activeExerciseKey, activePresetName);
    return userMeta.exerciseData[sKey] ?? null;
  }, [activeExerciseKey, activePresetName, userMeta]);

  // Build strength exercise groups for the combobox
  const strengthGroups: ExerciseGroupOption[] = useMemo(() => {
    const defaultGroups = DEFAULT_EXERCISE_GROUPS
      .filter((g) => g.group !== "cardio")
      .map((g) => ({
        label: CATEGORY_DISPLAY_NAMES[g.group] ?? g.group,
        exercises: g.items
          .map((key) => {
            const def = effectiveExerciseMap.get(key);
            return def ? { key: def.key, name: def.name } : null;
          })
          .filter(Boolean) as { key: string; name: string }[],
      }));

    // Add locally created custom exercises
    const localCustomGroups: ExerciseGroupOption[] = [];
    for (const def of Object.values(localCustomDefs)) {
      const catLabel = `Custom - ${CATEGORY_DISPLAY_NAMES[def.category] ?? def.category}`;
      let group = localCustomGroups.find((g) => g.label === catLabel);
      if (!group) {
        group = { label: catLabel, exercises: [] };
        localCustomGroups.push(group);
      }
      group.exercises.push({ key: def.key, name: def.name });
    }

    const allCustom = [...customExerciseGroups];
    for (const lcg of localCustomGroups) {
      const existing = allCustom.find((g) => g.label === lcg.label);
      if (existing) {
        const existingKeys = new Set(existing.exercises.map((e) => e.key));
        for (const ex of lcg.exercises) {
          if (!existingKeys.has(ex.key)) existing.exercises.push(ex);
        }
      } else {
        allCustom.push(lcg);
      }
    }

    // Build variation preset group (server + locally created)
    const serverPresets = userMeta?.variationPresets ?? [];
    const serverIds = new Set(serverPresets.map((p) => p.id));
    const mergedPresets = [
      ...serverPresets,
      ...localPresets.filter((lp) => !serverIds.has(lp.id)),
    ];
    const presetGroup: ExerciseGroupOption | null =
      mergedPresets.length > 0
        ? {
            label: "My Presets",
            exercises: mergedPresets.map((p) => {
              const baseName =
                effectiveExerciseMap.get(p.exerciseKey)?.name ?? p.exerciseKey;
              return {
                key: `preset::${p.id}`,
                name: `${baseName} · ${p.name}`,
              };
            }),
          }
        : null;

    const groups = [...(presetGroup ? [presetGroup] : []), ...allCustom, ...defaultGroups];
    return groups;
  }, [customExerciseGroups, effectiveExerciseMap, localCustomDefs, localPresets, userMeta]);

  // ---- Header overrides ----
  const settingsButton = useMemo(
    () => (
      <button
        onClick={() => setSettingsOpen(true)}
        className="p-2 hover:bg-accent rounded-md transition-colors"
        aria-label="Exercise Settings"
      >
        <Settings2 className="h-5 w-5 text-muted-foreground" />
      </button>
    ),
    [],
  );

  const overviewButton = useMemo(
    () => (
      <button
        onClick={() => setOverviewOpen(true)}
        className="relative p-2 hover:bg-accent rounded-md transition-colors"
        aria-label="Session Overview"
      >
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        {exercises.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center font-medium">
            {exercises.length}
          </span>
        )}
      </button>
    ),
    [exercises.length],
  );

  useEffect(() => {
    if (view === "logExercise" && activeExerciseKey && !activeExercise) {
      if (!hasWarnedMissingExercise.current) {
        hasWarnedMissingExercise.current = true;
        toast({
          title: "Exercise unavailable",
          description: "We couldn't load that exercise. Please select it again.",
          variant: "destructive",
        });
      }
      return;
    }
    hasWarnedMissingExercise.current = false;
  }, [view, activeExerciseKey, activeExercise, toast]);

  useEffect(() => {
    if (view === "logExercise" && activeExercise) {
      setHeaderInnerLeft(settingsButton);
    } else {
      setHeaderInnerLeft(null);
    }
    setHeaderInnerRight(overviewButton);

    return () => {
      setHeaderInnerLeft(null);
      setHeaderInnerRight(null);
    };
  }, [
    view,
    activeExercise,
    settingsButton,
    overviewButton,
    setHeaderInnerLeft,
    setHeaderInnerRight,
  ]);

  // ---- Handlers ----
  const handleSelectExercise = useCallback(
    async (key: string, presetVariations?: Record<string, string>, presetName?: string) => {
      setActiveExerciseKey(key);
      setActiveSets([{ weight: 0, reps: { bilateral: 0 } }]);
      setActivePresetName(presetName ?? null);
      setView("logExercise");

      if (presetVariations) {
        setActiveVariations(presetVariations);
        return;
      }

      try {
        const defaults = await getExerciseDefaultsAction(key);
        if (defaults && Object.keys(defaults).length > 0) {
          setActiveVariations(defaults);
        } else {
          const def = effectiveExerciseMap.get(key);
          if (def?.variationTemplates) {
            const v: Record<string, string> = {};
            for (const [tid, override] of Object.entries(def.variationTemplates)) {
              if (override.defaultOptionKey) {
                v[tid] = override.defaultOptionKey;
              }
            }
            setActiveVariations(v);
          } else {
            setActiveVariations({});
          }
        }
      } catch {
        setActiveVariations({});
      }
    },
    [effectiveExerciseMap],
  );

  const presetMap = useMemo(() => {
    const map = new Map<string, VariationPresetSummary>();
    for (const p of userMeta?.variationPresets ?? []) {
      map.set(p.id, p);
    }
    for (const p of localPresets) {
      map.set(p.id, p);
    }
    return map;
  }, [userMeta, localPresets]);

  const handleComboboxSelect = useCallback(
    (key: string) => {
      if (key.startsWith("preset::")) {
        const presetId = key.slice("preset::".length);
        const preset = presetMap.get(presetId);
        if (preset) {
          handleSelectExercise(preset.exerciseKey, preset.variations, preset.name);
          return;
        }
      }
      handleSelectExercise(key);
    },
    [handleSelectExercise, presetMap],
  );

  const handleCreateCustomExercise = useCallback(
    async (input: CreateCustomExerciseInput) => {
      const result = await createCustomExerciseAction(input);

      const newDef: CustomExerciseDefinition = {
        id: result.id,
        key: result.key,
        name: result.name,
        category: input.category as ExerciseCategory,
        repMode: input.repMode ?? "bilateral",
        baseTargets: input.targets.map((t) => ({
          muscle: t.muscle as CustomExerciseDefinition["baseTargets"][number]["muscle"],
          weight: t.weight,
        })),
        isCustom: true,
        variationTemplates: input.variationSupports.reduce(
          (acc, s) => {
            acc[s.templateId] = {
              templateId: s.templateId,
              defaultOptionKey: s.defaultOptionKey,
            };
            return acc;
          },
          {} as NonNullable<CustomExerciseDefinition["variationTemplates"]>,
        ),
      };

      setLocalCustomDefs((prev) => ({ ...prev, [result.key]: newDef }));

      toast({
        title: "Custom exercise created",
        description: `"${result.name}" is ready to use.`,
      });

      handleSelectExercise(result.key);
    },
    [handleSelectExercise, toast],
  );

  const handleSaveExercise = useCallback(() => {
    if (!activeExerciseKey) return;

    const entry: StrengthExerciseEntry = {
      type: "strength",
      exerciseType: activeExerciseKey,
      sets: activeSets.filter(
        (s) =>
          s.weight > 0 &&
          ((s.reps.bilateral !== undefined && s.reps.bilateral > 0) ||
            ((s.reps.left ?? 0) > 0 && (s.reps.right ?? 0) > 0)),
      ),
      variations: Object.keys(activeVariations).length > 0 ? activeVariations : undefined,
      presetName: activePresetName ?? undefined,
    };

    if (entry.sets.length === 0) {
      toast({
        title: "No valid sets",
        description: "Add at least one set with weight and reps.",
        variant: "destructive",
      });
      return;
    }

    setExercises((prev) => [...prev, entry]);
    captureClientEvent("workout_exercise_staged", {
      exercise_key: activeExerciseKey,
      set_count: entry.sets.length,
    });
    setActiveExerciseKey(null);
    setActiveSets([{ weight: 0, reps: { bilateral: 0 } }]);
    setActiveVariations({});
    setActivePresetName(null);
    setView("addExercise");

    toast({
      title: "Exercise saved",
      description: `${effectiveExerciseMap.get(activeExerciseKey)?.name ?? activeExerciseKey} added to session.`,
    });
  }, [activeExerciseKey, activeSets, activeVariations, effectiveExerciseMap, toast]);

  const handleDiscardExercise = useCallback(() => {
    setActiveExerciseKey(null);
    setActiveSets([{ weight: 0, reps: { bilateral: 0 } }]);
    setActiveVariations({});
    setActivePresetName(null);
    setView("addExercise");
  }, []);

  const handleDeleteExercise = useCallback((index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
    toast({
      title: "Exercise removed",
      description: "The exercise has been removed from this session.",
    });
  }, [toast]);

  const handleDiscardSession = useCallback(() => {
    clearPersistedState();
    setExercises([]);
    setActiveExerciseKey(null);
    setActiveSets([{ weight: 0, reps: { bilateral: 0 } }]);
    setActiveVariations({});
    setActivePresetName(null);
    setSessionDate(new Date());
    setStartTime(formatTimeNow());
    setEndTime(null);
    setView("addExercise");

    toast({
      title: "Session discarded",
      description: "Your workout session has been discarded.",
    });

    router.push("/");
  }, [toast, router]);

  const handleEndSession = useCallback(async () => {
    if (exercises.length === 0) return;
    setSubmitting(true);

    const endTimeStr = endTime ?? formatTimeNow();
    const dateStr = formatDateToYYYYMMDD(sessionDate);

    try {
      await createWorkoutSessionAction({
        date: dateStr,
        startTime,
        endTime: endTimeStr,
        exercises,
      });
      captureClientEvent("workout_session_logged", {
        exercise_count: exercises.length,
        used_manual_end_time: endTime !== null,
      });

      clearPersistedState();

      toast({
        title: "Workout saved!",
        description: "Your session has been recorded.",
      });

      router.push("/");
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "Unknown error";
      console.error("[handleEndSession] Workout submit failed:", err);
      toast({
        title: "Failed to save workout",
        description: detail,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [exercises, endTime, sessionDate, startTime, toast, router]);

  // ---- Render ----
  return (
    <div className="relative px-2 pt-2 flex flex-col items-center justify-center w-full">
      {view === "addExercise" && (
        <AddExercise
          strengthGroups={strengthGroups}
          onSelectExercise={handleComboboxSelect}
          sessionExercises={exercises}
          onReviewSession={() => setOverviewOpen(true)}
          onCreateCustomExercise={handleCreateCustomExercise}
        />
      )}

      {view === "logExercise" && activeExercise && (
        <ExerciseLogger
          exercise={activeExercise}
          sets={activeSets}
          onSetsChange={setActiveSets}
          onSaveExercise={handleSaveExercise}
          onDiscardExercise={handleDiscardExercise}
          onEditVariations={() => setSettingsOpen(true)}
          variations={activeVariations}
          stats={exerciseStats}
          presetName={activePresetName}
          repInputStyle={liveRepInputStyle}
        />
      )}

      {view === "logExercise" && activeExerciseKey && !activeExercise && (
        <div className="w-full max-w-md rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <p className="text-red-100">
            We couldn't load that exercise definition. Please return and select it again.
          </p>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => {
              setActiveExerciseKey(null);
              setView("addExercise");
            }}
          >
            Back to exercise picker
          </Button>
        </div>
      )}

      {/* Overlays */}
      <ExerciseSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        exercise={activeExercise}
        variations={activeVariations}
        onVariationsChange={setActiveVariations}
        onExerciseArchived={() => {
          setActiveExerciseKey(null);
          setActiveSets([{ weight: 0, reps: { bilateral: 0 } }]);
          setActiveVariations({});
          setActivePresetName(null);
          setView("addExercise");
          router.refresh();
        }}
        onExerciseRenamed={() => router.refresh()}
        onPresetCreated={(preset) => {
          setLocalPresets((prev) => [...prev, preset]);
          setActivePresetName(preset.name);
          router.refresh();
        }}
      />

      <SessionOverviewSheet
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
        exercises={exercises}
        exerciseMap={effectiveExerciseMap}
        onDeleteExercise={handleDeleteExercise}
        sessionDate={sessionDate}
        onSessionDateChange={setSessionDate}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTimeLabel={endTime ?? "now"}
        onEndTimeChange={setEndTime}
        onDiscardSession={handleDiscardSession}
        onEndSession={handleEndSession}
        submitting={submitting}
      />
    </div>
  );
}
