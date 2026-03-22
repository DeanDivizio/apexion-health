"use client";

import * as React from "react";
import { useContext, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_primitives/tabs";
import { MealOverviewSheet } from "./MealOverviewSheet";
import { FoodSearch } from "./FoodSearch";
import { RetailFlow } from "./RetailFlow";
import { createMealSessionAction } from "@/actions/nutrition";
import {
  loadPersistedMealState,
  savePersistedMealState,
  clearPersistedMealState,
} from "@/lib/nutrition/mealDraftStore";
import type {
  MealItemDraft,
  NutritionBootstrap,
  NutritionUserFoodView,
  RecentFoodEntry,
} from "@/lib/nutrition";
import { isoDateToCompactDateStr, toCompactDateStr } from "@/lib/dates/dateStr";

function todayDateStr(): string {
  return toCompactDateStr(new Date());
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function combineDateAndTime(dateIso: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(dateIso);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d.toISOString();
}

interface NutritionFlowProps {
  bootstrap: NutritionBootstrap;
}

export function NutritionFlow({ bootstrap }: NutritionFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setMobileHeading, setHeaderComponentLeft, setHeaderComponentRight } =
    useContext(MobileHeaderContext);

  const [activeTab, setActiveTab] = React.useState<"food" | "restaurant">("food");
  const [stagedItems, setStagedItems] = React.useState<MealItemDraft[]>([]);
  const [mealLabel, setMealLabel] = React.useState<string | null>(null);
  const [sessionDate, setSessionDate] = React.useState<string>(todayIso());
  const [sessionTime, setSessionTime] = React.useState<string>(nowTime());
  const [useManualTimestamp, setUseManualTimestamp] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedChainId, setSelectedChainId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [userFoods, setUserFoods] = React.useState<NutritionUserFoodView[]>(bootstrap.userFoods);

  // ── Persistence ──────────────────────────────────────────────────────
  const hasRestored = useRef(false);
  React.useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    const saved = loadPersistedMealState();
    if (!saved) return;
    setStagedItems(saved.items);
    setMealLabel(saved.mealLabel);
    setSessionDate(saved.sessionDateIso);
    setSessionTime(saved.sessionTime);
    setUseManualTimestamp(saved.useManualTimestamp);
    setActiveTab(saved.activeTab);
    setSelectedChainId(saved.selectedChainId);
  }, []);

  React.useEffect(() => {
    if (!hasRestored.current) return;
    savePersistedMealState({
      version: 1,
      items: stagedItems,
      mealLabel,
      sessionDateIso: sessionDate,
      sessionTime,
      useManualTimestamp,
      activeTab,
      selectedChainId,
    });
  }, [stagedItems, mealLabel, sessionDate, sessionTime, useManualTimestamp, activeTab, selectedChainId]);

  // ── Header ───────────────────────────────────────────────────────────
  const overviewButton = useMemo(
    () => (
      <button
        onClick={() => setSheetOpen(true)}
        className="relative p-2 hover:bg-accent rounded-md transition-colors"
        aria-label="Meal overview"
      >
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        {stagedItems.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center font-medium">
            {stagedItems.length}
          </span>
        )}
      </button>
    ),
    [stagedItems.length],
  );

  React.useEffect(() => {
    setHeaderComponentRight(overviewButton);
    return () => {
      setHeaderComponentRight(<div />);
    };
  }, [overviewButton, setHeaderComponentLeft, setHeaderComponentRight, setMobileHeading]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleAddItem = useCallback(
    (item: MealItemDraft) => {
      setStagedItems((prev) => [...prev, item]);
      toast({ title: `${item.snapshotName} added to meal` });
    },
    [toast],
  );

  const handleRemoveItem = useCallback((index: number) => {
    setStagedItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateServings = useCallback(
    (index: number, servings: number) => {
      setStagedItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, servings } : item)),
      );
    },
    [],
  );

  const handleSaveSession = useCallback(async () => {
    if (!stagedItems.length) {
      toast({ title: "No items", description: "Add at least one food item.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const loggedAtIso = useManualTimestamp
        ? combineDateAndTime(sessionDate, sessionTime)
        : new Date().toISOString();
      const dateStr = useManualTimestamp
        ? isoDateToCompactDateStr(sessionDate)
        : todayDateStr();

      await createMealSessionAction({
        loggedAtIso,
        dateStr,
        mealLabel,
        notes: null,
        items: stagedItems.map((item) => ({
          foodSource: item.foodSource,
          sourceFoodId: item.sourceFoodId,
          foundationFoodId: item.foundationFoodId,
          snapshotName: item.snapshotName,
          snapshotBrand: item.snapshotBrand,
          servings: item.servings,
          portionLabel: item.portionLabel,
          portionGramWeight: item.portionGramWeight,
          nutrients: item.nutrients,
        })),
      });

      setStagedItems([]);
      setMealLabel(null);
      setSheetOpen(false);
      setUseManualTimestamp(false);
      setSessionDate(todayIso());
      setSessionTime(nowTime());
      clearPersistedMealState();
      toast({ title: "Meal logged", description: `${stagedItems.length} item${stagedItems.length === 1 ? "" : "s"} recorded.` });
      router.push("/");
    } catch {
      toast({ title: "Error", description: "Unable to save meal. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [stagedItems, mealLabel, sessionDate, sessionTime, useManualTimestamp, toast, router]);

  const handleDiscardSession = useCallback(() => {
    setStagedItems([]);
    setMealLabel(null);
    setSheetOpen(false);
    clearPersistedMealState();
    toast({ title: "Meal discarded" });
  }, [toast]);

  const handleUserFoodCreated = useCallback((food: NutritionUserFoodView) => {
    setUserFoods((prev) => [food, ...prev]);
  }, []);

  return (
    <div className="relative px-2 pt-16 flex flex-col items-center w-full">
    <h1 className="text-2xl mb-8 mt-4">Log Meal</h1>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "food" | "restaurant")}
        className="w-full max-w-2xl"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="food">Food</TabsTrigger>
          <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
        </TabsList>

        <TabsContent value="food" className="mt-4">
          <FoodSearch
            userFoods={userFoods}
            recentFoods={bootstrap.recentFoods}
            onAddItem={handleAddItem}
            onUserFoodCreated={handleUserFoodCreated}
          />
        </TabsContent>

        <TabsContent value="restaurant" className="mt-4">
          <RetailFlow
            chains={bootstrap.retailChains}
            selectedChainId={selectedChainId}
            onSelectedChainIdChange={setSelectedChainId}
            onAddItem={handleAddItem}
          />
        </TabsContent>
      </Tabs>

      <MealOverviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        items={stagedItems}
        mealLabel={mealLabel}
        onMealLabelChange={setMealLabel}
        sessionDate={sessionDate}
        onSessionDateChange={setSessionDate}
        sessionTime={sessionTime}
        onSessionTimeChange={setSessionTime}
        useManualTimestamp={useManualTimestamp}
        onUseManualTimestampChange={setUseManualTimestamp}
        onRemoveItem={handleRemoveItem}
        onUpdateServings={handleUpdateServings}
        onSaveSession={handleSaveSession}
        onDiscardSession={handleDiscardSession}
        submitting={submitting}
      />
    </div>
  );
}
