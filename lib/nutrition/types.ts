export interface NutrientProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number;
  transFat?: number;
  fiber?: number;
  sugars?: number;
  addedSugars?: number;
  cholesterol?: number;
  sodium?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  magnesium?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  [key: string]: number | undefined;
}

export interface FoundationFoodPortion {
  amount: number;
  unit: string;
  gramWeight: number;
  modifier?: string;
}

export interface FoundationFoodView {
  id: string;
  fdcId: number;
  name: string;
  category: string | null;
  nutrients: NutrientProfile;
  portions: FoundationFoodPortion[];
  defaultServingSize: number;
  defaultServingUnit: string;
}

export interface NutritionUserFoodView {
  id: string;
  name: string;
  brand: string | null;
  nutrients: NutrientProfile;
  servingSize: number;
  servingUnit: string;
  ingredients: string | null;
}

export interface RetailChainView {
  id: string;
  key: string;
  name: string;
}

export interface RetailItemView {
  id: string;
  chainId: string;
  name: string;
  category: string | null;
  nutrients: NutrientProfile;
  servingSize: number | null;
  servingUnit: string | null;
  isUserItem: boolean;
}

export interface MealItemDraft {
  localId: string;
  foodSource: "foundation" | "complex" | "retail";
  sourceFoodId: string | null;
  foundationFoodId: string | null;
  snapshotName: string;
  snapshotBrand: string | null;
  servings: number;
  portionLabel: string | null;
  portionGramWeight: number | null;
  nutrients: NutrientProfile;
}

export interface NutritionMealSessionView {
  id: string;
  loggedAtIso: string;
  dateStr: string;
  mealLabel: string | null;
  notes: string | null;
  items: MealItemViewEntry[];
}

export interface MealItemViewEntry {
  foodSource: "foundation" | "complex" | "retail";
  sourceFoodId: string | null;
  foundationFoodId: string | null;
  snapshotName: string;
  snapshotBrand: string | null;
  servings: number;
  portionLabel: string | null;
  portionGramWeight: number | null;
  snapshotCalories: number;
  snapshotProtein: number;
  snapshotCarbs: number;
  snapshotFat: number;
}

export interface NutritionBootstrap {
  userFoods: NutritionUserFoodView[];
  retailChains: RetailChainView[];
  goals: NutritionUserGoalsView | null;
  recentFoods: RecentFoodEntry[];
}

export interface NutritionUserGoalsView {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  microGoals: Record<string, { target: number; unit: string }> | null;
  waterGoalOz: number | null;
  sodiumGoalMg: number | null;
  potassiumGoalMg: number | null;
  magnesiumGoalMg: number | null;
}

export interface MacroSummaryByDate {
  dateStr: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UnifiedFoodSearchResults {
  foundation: FoundationFoodView[];
  userFoods: NutritionUserFoodView[];
}

export type RecentFoodEntry =
  | { type: "foundation"; data: FoundationFoodView }
  | { type: "complex"; data: NutritionUserFoodView };
