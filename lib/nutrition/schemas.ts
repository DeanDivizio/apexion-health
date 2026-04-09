import { z } from "zod";

export const nutrientProfileSchema = z.object({
  calories: z.number().optional().default(0),
  protein: z.number().optional().default(0),
  carbs: z.number().optional().default(0),
  fat: z.number().optional().default(0),
  saturatedFat: z.number().optional(),
  transFat: z.number().optional(),
  fiber: z.number().optional(),
  sugars: z.number().optional(),
  addedSugars: z.number().optional(),
  cholesterol: z.number().optional(),
  sodium: z.number().optional(),
  calcium: z.number().optional(),
  iron: z.number().optional(),
  potassium: z.number().optional(),
  magnesium: z.number().optional(),
  vitaminA: z.number().optional(),
  vitaminC: z.number().optional(),
  vitaminD: z.number().optional(),
}).passthrough();

export const createUserFoodSchema = z.object({
  name: z.string().trim().min(1),
  brand: z.string().trim().nullable().default(null),
  nutrients: nutrientProfileSchema,
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1).default("g"),
  ingredients: z.string().nullable().default(null),
});

export const mealItemDraftSchema = z.object({
  foodSource: z.enum(["foundation", "complex", "retail", "ai_estimate"]),
  sourceFoodId: z.string().nullable().default(null),
  foundationFoodId: z.string().nullable().default(null),
  snapshotName: z.string().min(1),
  snapshotBrand: z.string().nullable().default(null),
  servings: z.number().positive(),
  portionLabel: z.string().nullable().default(null),
  portionGramWeight: z.number().nullable().default(null),
  nutrients: nutrientProfileSchema,
});

export const createMealSessionSchema = z.object({
  loggedAtIso: z.string().datetime(),
  dateStr: z.string().min(8),
  mealLabel: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  items: z.array(mealItemDraftSchema).min(1),
});

export const createRetailChainSchema = z.object({
  name: z.string().trim().min(1),
});

export const createRetailItemSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().nullable().default(null),
  nutrients: nutrientProfileSchema,
  servingSize: z.number().nullable().default(null),
  servingUnit: z.string().nullable().default(null),
});

export const createRetailUserItemSchema = z.object({
  chainId: z.string().min(1),
  name: z.string().trim().min(1),
  category: z.string().nullable().default(null),
  nutrients: nutrientProfileSchema,
  servingSize: z.number().nullable().default(null),
  servingUnit: z.string().nullable().default(null),
});

export const createFoodPresetSchema = z.object({
  name: z.string().trim().min(1),
  items: z.array(mealItemDraftSchema).min(1),
});

export const updateFoodPresetSchema = z.object({
  name: z.string().trim().min(1).optional(),
  items: z.array(mealItemDraftSchema).min(1).optional(),
});

export const upsertUserGoalsSchema = z.object({
  calories: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  carbs: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  microGoals: z.record(z.object({
    target: z.number(),
    unit: z.string(),
  })).nullable().optional(),
  waterGoalOz: z.number().nullable().optional(),
  sodiumGoalMg: z.number().nullable().optional(),
  potassiumGoalMg: z.number().nullable().optional(),
  magnesiumGoalMg: z.number().nullable().optional(),
});

export type CreateUserFoodInput = z.infer<typeof createUserFoodSchema>;
export type MealItemDraftInput = z.infer<typeof mealItemDraftSchema>;
export type CreateMealSessionInput = z.infer<typeof createMealSessionSchema>;
export type CreateRetailChainInput = z.infer<typeof createRetailChainSchema>;
export type CreateRetailItemInput = z.infer<typeof createRetailItemSchema>;
export type CreateRetailUserItemInput = z.infer<typeof createRetailUserItemSchema>;
export type CreateFoodPresetInput = z.infer<typeof createFoodPresetSchema>;
export type UpdateFoodPresetInput = z.infer<typeof updateFoodPresetSchema>;
export type UpsertUserGoalsInput = z.infer<typeof upsertUserGoalsSchema>;
