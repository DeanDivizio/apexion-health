import { useState, useCallback, useMemo } from "react";

const MIN_PROTEIN_G = 10;
const MIN_CARBS_G = 20;
const MIN_FAT_G = 15;
const CAL_PER_G_PROTEIN = 4;
const CAL_PER_G_CARBS = 4;
const CAL_PER_G_FAT = 9;

const MIN_PROTEIN_CAL = MIN_PROTEIN_G * CAL_PER_G_PROTEIN;
const MIN_CARBS_CAL = MIN_CARBS_G * CAL_PER_G_CARBS;
const MIN_FAT_CAL = MIN_FAT_G * CAL_PER_G_FAT;

interface MacroState {
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

interface MacroDerived {
  proteinCal: number;
  carbCal: number;
  fatCal: number;
  proteinPct: number;
  carbPct: number;
  fatPct: number;
}

export interface CoupledMacroSliders extends MacroState, MacroDerived {
  setCalories: (val: number) => void;
  setProtein: (val: number) => void;
  setCarbs: (val: number) => void;
  setFat: (val: number) => void;
  proteinMax: number;
  carbMax: number;
  fatMax: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function useCoupledMacroSliders(
  initialCalories: number | null,
  initialProtein: number | null,
  initialCarbs: number | null,
  initialFat: number | null,
): CoupledMacroSliders {
  const [state, setState] = useState<MacroState>(() => ({
    calories: initialCalories ?? 2000,
    proteinGrams: initialProtein ?? 150,
    carbGrams: initialCarbs ?? 200,
    fatGrams: initialFat ?? 67,
  }));

  const setCalories = useCallback((newCal: number) => {
    setState((prev) => {
      const cal = clamp(newCal, 1200, 5000);
      const totalMacroCal =
        prev.proteinGrams * CAL_PER_G_PROTEIN +
        prev.carbGrams * CAL_PER_G_CARBS +
        prev.fatGrams * CAL_PER_G_FAT;

      if (totalMacroCal === 0) {
        return { calories: cal, proteinGrams: 150, carbGrams: 200, fatGrams: 67 };
      }

      const ratio = cal / totalMacroCal;
      let protein = Math.max(MIN_PROTEIN_G, Math.round(prev.proteinGrams * ratio));
      let carbs = Math.max(MIN_CARBS_G, Math.round(prev.carbGrams * ratio));
      let fat = Math.max(MIN_FAT_G, Math.round(prev.fatGrams * ratio));

      const used = protein * CAL_PER_G_PROTEIN + carbs * CAL_PER_G_CARBS + fat * CAL_PER_G_FAT;
      const diff = cal - used;
      if (Math.abs(diff) >= CAL_PER_G_CARBS) {
        carbs += Math.round(diff / CAL_PER_G_CARBS);
        carbs = Math.max(MIN_CARBS_G, carbs);
      }

      return { calories: cal, proteinGrams: protein, carbGrams: carbs, fatGrams: fat };
    });
  }, []);

  const rebalanceOthers = useCallback(
    (
      totalCal: number,
      movedCal: number,
      otherAGrams: number,
      otherBGrams: number,
      otherACalPerG: number,
      otherBCalPerG: number,
      otherAMin: number,
      otherBMin: number,
    ): [number, number] => {
      const remaining = totalCal - movedCal;
      const otherACal = otherAGrams * otherACalPerG;
      const otherBCal = otherBGrams * otherBCalPerG;
      const otherTotal = otherACal + otherBCal;

      let newAGrams: number;
      let newBGrams: number;

      if (otherTotal === 0) {
        newAGrams = Math.round(remaining / 2 / otherACalPerG);
        newBGrams = Math.round(remaining / 2 / otherBCalPerG);
      } else {
        const ratioA = otherACal / otherTotal;
        const ratioB = otherBCal / otherTotal;
        newAGrams = Math.round((remaining * ratioA) / otherACalPerG);
        newBGrams = Math.round((remaining * ratioB) / otherBCalPerG);
      }

      newAGrams = Math.max(otherAMin, newAGrams);
      newBGrams = Math.max(otherBMin, newBGrams);

      return [newAGrams, newBGrams];
    },
    [],
  );

  const setProtein = useCallback(
    (grams: number) => {
      setState((prev) => {
        const maxCal = prev.calories - MIN_CARBS_CAL - MIN_FAT_CAL;
        const clamped = clamp(grams, MIN_PROTEIN_G, Math.floor(maxCal / CAL_PER_G_PROTEIN));
        const movedCal = clamped * CAL_PER_G_PROTEIN;
        const [carbs, fat] = rebalanceOthers(
          prev.calories, movedCal,
          prev.carbGrams, prev.fatGrams,
          CAL_PER_G_CARBS, CAL_PER_G_FAT,
          MIN_CARBS_G, MIN_FAT_G,
        );
        return { ...prev, proteinGrams: clamped, carbGrams: carbs, fatGrams: fat };
      });
    },
    [rebalanceOthers],
  );

  const setCarbs = useCallback(
    (grams: number) => {
      setState((prev) => {
        const maxCal = prev.calories - MIN_PROTEIN_CAL - MIN_FAT_CAL;
        const clamped = clamp(grams, MIN_CARBS_G, Math.floor(maxCal / CAL_PER_G_CARBS));
        const movedCal = clamped * CAL_PER_G_CARBS;
        const [protein, fat] = rebalanceOthers(
          prev.calories, movedCal,
          prev.proteinGrams, prev.fatGrams,
          CAL_PER_G_PROTEIN, CAL_PER_G_FAT,
          MIN_PROTEIN_G, MIN_FAT_G,
        );
        return { ...prev, carbGrams: clamped, proteinGrams: protein, fatGrams: fat };
      });
    },
    [rebalanceOthers],
  );

  const setFat = useCallback(
    (grams: number) => {
      setState((prev) => {
        const maxCal = prev.calories - MIN_PROTEIN_CAL - MIN_CARBS_CAL;
        const clamped = clamp(grams, MIN_FAT_G, Math.floor(maxCal / CAL_PER_G_FAT));
        const movedCal = clamped * CAL_PER_G_FAT;
        const [protein, carbs] = rebalanceOthers(
          prev.calories, movedCal,
          prev.proteinGrams, prev.carbGrams,
          CAL_PER_G_PROTEIN, CAL_PER_G_CARBS,
          MIN_PROTEIN_G, MIN_CARBS_G,
        );
        return { ...prev, fatGrams: clamped, proteinGrams: protein, carbGrams: carbs };
      });
    },
    [rebalanceOthers],
  );

  const derived = useMemo<MacroDerived>(() => {
    const proteinCal = state.proteinGrams * CAL_PER_G_PROTEIN;
    const carbCal = state.carbGrams * CAL_PER_G_CARBS;
    const fatCal = state.fatGrams * CAL_PER_G_FAT;
    const total = proteinCal + carbCal + fatCal || 1;
    return {
      proteinCal,
      carbCal,
      fatCal,
      proteinPct: Math.round((proteinCal / total) * 100),
      carbPct: Math.round((carbCal / total) * 100),
      fatPct: Math.round((fatCal / total) * 100),
    };
  }, [state]);

  const proteinMax = Math.floor(
    (state.calories - MIN_CARBS_CAL - MIN_FAT_CAL) / CAL_PER_G_PROTEIN,
  );
  const carbMax = Math.floor(
    (state.calories - MIN_PROTEIN_CAL - MIN_FAT_CAL) / CAL_PER_G_CARBS,
  );
  const fatMax = Math.floor(
    (state.calories - MIN_PROTEIN_CAL - MIN_CARBS_CAL) / CAL_PER_G_FAT,
  );

  return {
    ...state,
    ...derived,
    setCalories,
    setProtein,
    setCarbs,
    setFat,
    proteinMax,
    carbMax,
    fatMax,
  };
}
