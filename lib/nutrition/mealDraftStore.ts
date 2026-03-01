import type { MealItemDraft } from "./types";

const STORAGE_KEY = "apexion-meal-session";
const STORAGE_VERSION = 1;

export interface PersistedMealState {
  version: number;
  items: MealItemDraft[];
  mealLabel: string | null;
  sessionDateIso: string;
  sessionTime: string;
  useManualTimestamp: boolean;
  activeTab: "food" | "restaurant";
  selectedChainId: string | null;
}

export function loadPersistedMealState(): PersistedMealState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as PersistedMealState;
  } catch {
    return null;
  }
}

export function savePersistedMealState(state: PersistedMealState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — silently fail */
  }
}

export function clearPersistedMealState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
