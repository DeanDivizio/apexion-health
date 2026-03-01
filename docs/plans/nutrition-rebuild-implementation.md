# Nutrition Rebuild — Implementation Plan

> **Context docs**: Read this file alongside `NutritionRebuild.md` (the spec).
> These two documents together provide all context needed for implementation.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prisma Schema](#2-prisma-schema)
3. [OCR Primitive](#3-ocr-primitive)
4. [Server-Side Service Layer](#4-server-side-service-layer)
5. [Server Actions](#5-server-actions)
6. [Zod Schemas & Types](#6-zod-schemas--types)
7. [Client State & localStorage Persistence](#7-client-state--localstorage-persistence)
8. [UI — Meal Logging Flow (`/logmeal`)](#8-ui--meal-logging-flow-logmeal)
9. [UI — MealOverviewSheet (Staging Area)](#9-ui--mealoverviewsheet-staging-area)
10. [UI — Food Tab (Complex + Foundation)](#10-ui--food-tab-complex--foundation)
11. [UI — Label Scanning (OCR)](#11-ui--label-scanning-ocr)
12. [UI — Restaurant Tab (Retail)](#12-ui--restaurant-tab-retail)
13. [UI — Chain Data Import (`/logmeal/addchaindata`)](#13-ui--chain-data-import-logmealaddchaindata)
14. [UI — Meals History Page (`/meals`)](#14-ui--meals-history-page-meals)
15. [Homepage Macros Update](#15-homepage-macros-update)
16. [USDA Foundation Import Script](#16-usda-foundation-import-script)
17. [Migration & Cleanup](#17-migration--cleanup)
18. [File Manifest](#18-file-manifest)

---

## 1. Architecture Overview

### Patterns to follow (matching gym & meds)

| Concern | Pattern | Reference |
|---------|---------|-----------|
| Data access | Prisma service layer (`lib/nutrition/server/nutritionService.ts`) | `lib/medication/server/medicationService.ts` |
| Validation | Zod schemas (`lib/nutrition/schemas.ts`) | `lib/medication/schemas.ts` |
| Auth + parse | Server actions (`actions/nutrition.ts`) | `actions/medication.ts` |
| Client flow | Parent component owns staging state | `WorkoutFlow.tsx`, `MedicationFlow.tsx` |
| Draft persistence | localStorage with versioned key | `apexion-workout-session`, `apexion-medication-session` |
| Staging UI | Right-side Sheet | `SessionOverviewSheet.tsx`, `MedicationOverviewSheet.tsx` |
| Search UI | Popover + Command (cmdk) combobox | `ExerciseCombobox.tsx`, `SubstanceCombobox.tsx` |
| Forms | react-hook-form + zod + `Form` primitives | Throughout project |
| Detail/selection UIs | Dialog | `LogHydrationDialog.tsx`, various confirm dialogs |

### Key architectural decisions

- **No React Context** for meal state (unlike current implementation). Use parent-owned state in `NutritionFlow.tsx` with localStorage persistence, matching gym and meds patterns.
- **Everything in Supabase/Prisma.** No raw SQL queries, no separate Postgres instance, no DynamoDB. The existing `usdafoundation`, `usdabranded`, and `restaurantBranded` raw SQL tables are abandoned. USDA foundation data is imported into a Prisma model. USDA branded data is dropped entirely.
- **Three food sources:**
  - **Foundation** — USDA foundation foods (single-ingredient items like eggs, broccoli, chicken). Stored in `NutritionFoundationFood` Prisma model. Read-only, not modifiable by users. Multiple portions supported with a dropdown.
  - **Complex** — User-scanned or manually-created packaged foods. Stored in `NutritionUserFood` per-user. Users must scan a label or manually enter a food the first time; it's saved for future use.
  - **Retail** — Restaurant chain menu items. Global items in `NutritionRetailItem`, user-specific additions in `NutritionRetailUserItem`.
- **Shared nutrient key namespace** with the medication/supplement system. The `nutrientKey` on `NutritionMealItemNutrient` uses the same keys as `ingredientKey` on `SubstanceLogItemIngredient` (e.g., `"vitamin-d"`, `"calcium"`). This enables cross-system aggregation queries later.
- **User nutrition goals in Prisma**, not Clerk metadata. A new `NutritionUserGoals` model stores macro goals and is extensible for micronutrient goals. The homepage reads from this model instead of `user.publicMetadata.markers.nutrition`.
- **OpenAI `gpt-5.2`** for OCR (label scanning and chain data import). Install the `openai` npm package.
- **Mobile-first** for the main logging flows (`/logmeal`, `/meals`). **Desktop-focused** for the chain data import admin tool (`/logmeal/addchaindata`).
- **Dialogs** (not drawers) for food detail, serving selection, and confirmation flows — matching existing app patterns.

### Data flow summary

```
User action → Component state → localStorage (draft)
                                        ↓
                               "Save Meal" click
                                        ↓
                            Server action (auth + parse)
                                        ↓
                             nutritionService (Prisma tx)
                                        ↓
                              NutritionMealSession
                              NutritionMealItem[]
                              NutritionMealItemNutrient[]
                                        ↓
                              clear localStorage → navigate home
```

---

## 2. Prisma Schema

Add the following to `prisma/schema.prisma`. Place after the Substance section.

### Enums

```prisma
enum NutritionFoodSource {
  foundation
  complex
  retail
}
```

### Foundation foods (USDA data, read-only)

```prisma
model NutritionFoundationFood {
  id                 String   @id @default(uuid())
  fdcId              Int      @unique
  name               String
  category           String?
  nutrients          Json     // NutrientProfile shape (see below)
  portions           Json?    // Array of { amount: number, unit: string, gramWeight: number, modifier?: string }
  defaultServingSize Float    @default(100)
  defaultServingUnit String   @default("g")
  createdAt          DateTime @default(now())

  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

> **Note on text search:** The `@@index` with `gin_trgm_ops` enables fast `ILIKE` / trigram searches on the `name` column. If the Prisma version doesn't support this syntax, create the index via a raw SQL migration step:
> ```sql
> CREATE EXTENSION IF NOT EXISTS pg_trgm;
> CREATE INDEX idx_foundation_food_name_trgm ON "NutritionFoundationFood" USING gin (name gin_trgm_ops);
> ```

### User-created foods (complex items from label scanning / manual entry)

```prisma
model NutritionUserFood {
  id          String   @id @default(uuid())
  userId      String
  name        String
  brand       String?
  nutrients   Json     // NutrientProfile
  servingSize Float
  servingUnit String   @default("g")
  ingredients String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, name])
  @@index([userId, active])
}
```

### Retail chain models

```prisma
model NutritionRetailChain {
  id        String   @id @default(uuid())
  key       String   @unique
  name      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  globalItems NutritionRetailItem[]
  userItems   NutritionRetailUserItem[]
}

model NutritionRetailItem {
  id          String               @id @default(uuid())
  chainId     String
  chain       NutritionRetailChain @relation(fields: [chainId], references: [id], onDelete: Cascade)
  name        String
  category    String?
  nutrients   Json                 // NutrientProfile
  servingSize Float?
  servingUnit String?
  active      Boolean              @default(true)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  @@index([chainId, name])
}

model NutritionRetailUserItem {
  id          String               @id @default(uuid())
  chainId     String
  chain       NutritionRetailChain @relation(fields: [chainId], references: [id], onDelete: Cascade)
  userId      String
  name        String
  category    String?
  nutrients   Json                 // NutrientProfile
  servingSize Float?
  servingUnit String?
  active      Boolean              @default(true)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  @@index([chainId, userId])
  @@index([userId])
}
```

### Meal logging models

```prisma
model NutritionMealSession {
  id        String   @id @default(uuid())
  userId    String
  loggedAt  DateTime
  dateStr   String
  mealLabel String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items NutritionMealItem[]

  @@index([userId, dateStr])
  @@index([userId, loggedAt])
}

model NutritionMealItem {
  id               String               @id @default(uuid())
  sessionId        String
  session          NutritionMealSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  foodSource       NutritionFoodSource
  sourceFoodId     String?              // UUID of UserFood, RetailItem, or RetailUserItem
  foundationFoodId String?              // UUID of NutritionFoundationFood
  snapshotName     String
  snapshotBrand    String?
  servings         Float
  portionLabel     String?              // e.g., "1 large" for foundation foods
  portionGramWeight Float?              // gram weight of selected portion
  sortOrder        Int                  @default(0)

  snapshotCalories Float
  snapshotProtein  Float
  snapshotCarbs    Float
  snapshotFat      Float

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  nutrients NutritionMealItemNutrient[]

  @@index([sessionId, sortOrder])
}

model NutritionMealItemNutrient {
  id           String            @id @default(uuid())
  mealItemId   String
  mealItem     NutritionMealItem @relation(fields: [mealItemId], references: [id], onDelete: Cascade)
  nutrientKey  String            // Shared namespace with SubstanceLogItemIngredient.ingredientKey
  nutrientName String
  amount       Float             // Total = perServing * servings
  unit         String
  createdAt    DateTime          @default(now())

  @@index([mealItemId])
  @@index([nutrientKey, amount])
}
```

### User nutrition goals

```prisma
model NutritionUserGoals {
  id        String   @id @default(uuid())
  userId    String   @unique
  calories  Float?
  protein   Float?
  carbs     Float?
  fat       Float?
  microGoals Json?   // { [nutrientKey: string]: { target: number, unit: string } }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Nutrient JSON shape

All food items (`NutritionFoundationFood`, `NutritionUserFood`, `NutritionRetailItem`, `NutritionRetailUserItem`) store a `nutrients` JSON field with this shape:

```typescript
interface NutrientProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number;
  transFat?: number;
  fiber?: number;
  sugars?: number;
  addedSugars?: number;
  cholesterol?: number;  // mg
  sodium?: number;       // mg
  calcium?: number;      // mg
  iron?: number;         // mg
  potassium?: number;    // mg
  vitaminA?: number;     // mcg
  vitaminC?: number;     // mg
  vitaminD?: number;     // mcg
  [key: string]: number | undefined;
}
```

All nutrient values are **per serving**. For foundation foods, this means per `defaultServingSize` (typically 100g). When a user selects a portion (e.g., "1 large egg" = 50g), the per-100g values are scaled by `portionGramWeight / 100`.

### Foundation food portions JSON shape

```typescript
interface FoundationFoodPortion {
  amount: number;       // e.g., 1
  unit: string;         // e.g., "large"
  gramWeight: number;   // e.g., 50
  modifier?: string;    // e.g., "whole, raw"
}
```

### Nutrient key mapping

Create a constant map at `lib/nutrition/nutrientKeys.ts`:

```typescript
export const NUTRIENT_KEYS = {
  calories:     { key: "calories",      name: "Calories",       unit: "kcal",  category: "macro" },
  protein:      { key: "protein",       name: "Protein",        unit: "g",     category: "macro" },
  carbs:        { key: "carbs",         name: "Carbohydrates",  unit: "g",     category: "macro" },
  fat:          { key: "fat",           name: "Total Fat",      unit: "g",     category: "macro" },
  saturatedFat: { key: "saturated-fat", name: "Saturated Fat",  unit: "g",     category: "macro" },
  transFat:     { key: "trans-fat",     name: "Trans Fat",      unit: "g",     category: "macro" },
  fiber:        { key: "fiber",         name: "Dietary Fiber",  unit: "g",     category: "macro" },
  sugars:       { key: "sugars",        name: "Total Sugars",   unit: "g",     category: "macro" },
  addedSugars:  { key: "added-sugars",  name: "Added Sugars",   unit: "g",     category: "macro" },
  cholesterol:  { key: "cholesterol",   name: "Cholesterol",    unit: "mg",    category: "other" },
  sodium:       { key: "sodium",        name: "Sodium",         unit: "mg",    category: "mineral" },
  calcium:      { key: "calcium",       name: "Calcium",        unit: "mg",    category: "mineral" },
  iron:         { key: "iron",          name: "Iron",           unit: "mg",    category: "mineral" },
  potassium:    { key: "potassium",     name: "Potassium",      unit: "mg",    category: "mineral" },
  magnesium:    { key: "magnesium",     name: "Magnesium",      unit: "mg",    category: "mineral" },
  vitaminA:     { key: "vitamin-a",     name: "Vitamin A",      unit: "mcg",   category: "vitamin" },
  vitaminC:     { key: "vitamin-c",     name: "Vitamin C",      unit: "mg",    category: "vitamin" },
  vitaminD:     { key: "vitamin-d",     name: "Vitamin D",      unit: "mcg",   category: "vitamin" },
} as const;
```

These keys must match or be mappable to the `ingredientKey` values used in the substance/medication system for cross-tracking.

---

## 3. OCR Primitive

Build a reusable OCR module at `lib/ocr/` that can be used for nutrition labels now and lab results later.

### Install dependency

```bash
npm install openai
```

### File: `lib/ocr/extractStructuredData.ts`

A generic function that takes an image and a JSON schema description, sends it to GPT-5.2's vision API, and returns parsed structured data.

```typescript
import OpenAI from "openai";
import { z, ZodSchema } from "zod";

interface ExtractionRequest<T> {
  image: string;              // base64 data URL (data:image/...) or public URL
  systemPrompt: string;       // Domain-specific extraction instructions
  responseSchema: ZodSchema<T>;
  model?: string;             // defaults to "gpt-5.2"
}

export async function extractStructuredData<T>(req: ExtractionRequest<T>): Promise<T>
```

Implementation details:
1. Initialize OpenAI client using `OPENAI_API_KEY` env var
2. Construct message with image using the `image_url` content part (base64 data URLs are supported directly)
3. System prompt instructs the model to extract data and return **only** valid JSON matching the described shape
4. Use `response_format: { type: "json_object" }` for reliable structured output
5. Parse the response JSON string, then validate with the provided Zod schema
6. Throw descriptive errors on parse failure with the raw response included for debugging

### File: `lib/ocr/extractNutritionLabel.ts`

Wraps `extractStructuredData` with a nutrition-label-specific system prompt and Zod schema.

```typescript
export interface NutritionLabelData {
  foodName: string | null;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  servingsPerContainer: number | null;
  nutrients: NutrientProfile;
  ingredients: string | null;
}

export async function extractNutritionLabel(image: string): Promise<NutritionLabelData>
```

System prompt should instruct the model to:
- Extract ALL nutrients visible on the label
- Use standardized units (g, mg, mcg, kcal)
- Convert %DV to absolute amounts where the DV is known (e.g., Vitamin D 20% DV = 4mcg)
- Return `null` for values not visible on the label
- If the food name or brand is visible on the image, extract those too
- `servingSize` and `servingUnit` should reflect the label's "Serving Size" line

### File: `lib/ocr/extractRetailMenuData.ts`

Wraps `extractStructuredData` for extracting multiple menu items from a restaurant nutrition PDF/image.

```typescript
export interface RetailMenuItemData {
  name: string;
  category: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  nutrients: NutrientProfile;
}

export async function extractRetailMenuData(
  image: string,
  chainName: string
): Promise<RetailMenuItemData[]>
```

The system prompt should:
- Know it's reading a restaurant nutrition chart/table
- Extract every menu item visible
- Recognize common table formats (columns for calories, fat, protein, etc.)
- Use the chain name for context (e.g., knowing Chipotle items include build-your-own components)

### File: `lib/ocr/index.ts`

Barrel export of all public functions.

---

## 4. Server-Side Service Layer

### File: `lib/nutrition/server/nutritionService.ts`

Follow the same patterns as `medicationService.ts`:
- Import `prisma` from `@/lib/db/prisma`
- Cast as `any` with `TxClient` type alias for transaction usage (same pattern as meds)
- Use `$transaction` for multi-model writes
- Map DB rows to UI-friendly view types
- Guard with `assertModelsAvailable` pattern

### Functions to implement:

#### Bootstrap

```typescript
export async function getNutritionBootstrap(userId: string): Promise<NutritionBootstrap>
```

Returns `{ userFoods, retailChains, goals }`:
- `userFoods`: All active `NutritionUserFood` for the user, ordered by name
- `retailChains`: All active `NutritionRetailChain`, ordered by name
- `goals`: The user's `NutritionUserGoals` row (or null)

#### Foundation food search

```typescript
export async function searchFoundationFoods(query: string, limit?: number): Promise<FoundationFoodView[]>
```

Queries `NutritionFoundationFood` by name using `ILIKE` / `contains`. Returns results with id, fdcId, name, category, nutrients, portions, defaultServingSize, defaultServingUnit.

#### User food CRUD

```typescript
export async function createUserFood(userId: string, input: CreateUserFoodInput): Promise<NutritionUserFoodView>
export async function searchUserFoods(userId: string, query: string, limit?: number): Promise<NutritionUserFoodView[]>
```

`searchUserFoods` queries `NutritionUserFood` where `userId` matches and `name` contains the query, `active = true`.

#### Retail operations

```typescript
export async function listRetailChains(): Promise<RetailChainView[]>
export async function searchRetailItems(chainId: string, query: string, userId: string, limit?: number): Promise<RetailItemView[]>
export async function createRetailUserItem(userId: string, input: CreateRetailUserItemInput): Promise<RetailItemView>
export async function createRetailChain(input: CreateRetailChainInput): Promise<RetailChainView>
export async function bulkCreateRetailItems(chainId: string, items: CreateRetailItemInput[]): Promise<number>
```

`searchRetailItems` searches **both** `NutritionRetailItem` (global) and `NutritionRetailUserItem` (user-scoped) for the given chain, merges results, and tags each with `isUserItem: boolean`.

`bulkCreateRetailItems` uses `createMany` for efficiency when importing large chain menus.

#### Meal session CRUD

```typescript
export async function createMealSession(userId: string, input: CreateMealSessionInput): Promise<NutritionMealSessionView>
export async function listMealSessions(userId: string, options?: { startDate?: string; endDate?: string }): Promise<NutritionMealSessionView[]>
export async function getMealSession(userId: string, sessionId: string): Promise<NutritionMealSessionView | null>
export async function updateMealSession(userId: string, sessionId: string, input: CreateMealSessionInput): Promise<void>
export async function deleteMealSession(userId: string, sessionId: string): Promise<void>
```

##### `createMealSession` detail (inside `$transaction`):

1. Create `NutritionMealSession` with userId, loggedAt, dateStr, mealLabel, notes
2. For each item in `input.items`:
   a. Compute total macros: `nutrient_value_per_serving * servings` (for foundation foods, also apply portion scaling: `nutrient_value_per_100g * portionGramWeight / 100 * servings`)
   b. Create `NutritionMealItem` with:
      - snapshotted macro totals (snapshotCalories, snapshotProtein, snapshotCarbs, snapshotFat)
      - foodSource, sourceFoodId or foundationFoodId, snapshotName, snapshotBrand
      - servings, portionLabel, portionGramWeight, sortOrder
   c. Create `NutritionMealItemNutrient` rows for **every** nutrient on the food item (not just macros). Each row stores:
      - `nutrientKey` from `NUTRIENT_KEYS` (e.g., `"vitamin-d"`)
      - `nutrientName` (e.g., `"Vitamin D"`)
      - `amount` = per-serving value × servings (with portion scaling for foundation foods)
      - `unit` from `NUTRIENT_KEYS`

This denormalization is the same concept as `persistLogItemsForSession` in `medicationService.ts` — snapshot all nutrient data at log time so cross-system queries can work without joining back to the source food.

##### `updateMealSession` detail (inside `$transaction`):

1. Verify the session belongs to the user
2. Update session fields (loggedAt, dateStr, mealLabel, notes)
3. Delete all existing `NutritionMealItem` rows (cascade deletes nutrients)
4. Re-create items and nutrients (same as create flow)

#### Macro summary for homepage

```typescript
export async function getMacroSummaryByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<MacroSummaryByDate[]>
```

1. Query `NutritionMealSession` where `userId` matches and `dateStr` is between start/end
2. Include `items` selecting only `snapshotCalories`, `snapshotProtein`, `snapshotCarbs`, `snapshotFat`
3. Group by `dateStr`, sum macros per date
4. Return array of `{ dateStr, calories, protein, carbs, fat }`

#### User goals

```typescript
export async function getUserGoals(userId: string): Promise<NutritionUserGoalsView | null>
export async function upsertUserGoals(userId: string, input: UpsertUserGoalsInput): Promise<NutritionUserGoalsView>
```

`upsertUserGoals` uses Prisma's `upsert` on the unique `userId` constraint.

---

## 5. Server Actions

### File: `actions/nutrition.ts`

Follow the pattern of `actions/medication.ts`. Every action:
1. Calls `requireUserId()` (auth check via Clerk's `auth()`)
2. Parses input with the appropriate Zod schema
3. Delegates to `nutritionService`

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { /* schemas */ } from "@/lib/nutrition";
import { /* service functions */ } from "@/lib/nutrition/server/nutritionService";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

// Bootstrap
export async function getNutritionBootstrapAction()

// Food search (unified: foundation + user foods)
export async function searchFoodsAction(query: string)
// Implementation: Promise.all([searchFoundationFoods(query), searchUserFoods(userId, query)])
// Returns: { foundation: FoundationFoodView[], userFoods: NutritionUserFoodView[] }

// User food CRUD
export async function createUserFoodAction(input: unknown)

// Retail
export async function searchRetailItemsAction(chainId: string, query: string)
export async function createRetailUserItemAction(input: unknown)

// Meal CRUD
export async function createMealSessionAction(input: unknown)
export async function listMealSessionsAction(options?: { startDate?: string; endDate?: string })
export async function getMealSessionAction(sessionId: string)
export async function updateMealSessionAction(sessionId: string, input: unknown)
export async function deleteMealSessionAction(sessionId: string)

// Homepage
export async function getMacroSummaryAction(startDate: string, endDate: string)

// Goals
export async function getUserGoalsAction()
export async function upsertUserGoalsAction(input: unknown)

// Retail chain admin
export async function createRetailChainAction(input: unknown)
export async function bulkCreateRetailItemsAction(chainId: string, items: unknown)
```

### File: `actions/ocr.ts`

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { extractNutritionLabel } from "@/lib/ocr/extractNutritionLabel";
import { extractRetailMenuData } from "@/lib/ocr/extractRetailMenuData";

export async function extractNutritionLabelAction(imageBase64: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return extractNutritionLabel(imageBase64);
}

export async function extractRetailMenuAction(imageBase64: string, chainName: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return extractRetailMenuData(imageBase64, chainName);
}
```

---

## 6. Zod Schemas & Types

### File: `lib/nutrition/schemas.ts`

```typescript
import { z } from "zod";

export const nutrientProfileSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
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
  foodSource: z.enum(["foundation", "complex", "retail"]),
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

export const upsertUserGoalsSchema = z.object({
  calories: z.number().nullable().default(null),
  protein: z.number().nullable().default(null),
  carbs: z.number().nullable().default(null),
  fat: z.number().nullable().default(null),
  microGoals: z.record(z.object({
    target: z.number(),
    unit: z.string(),
  })).nullable().default(null),
});

// Inferred types
export type CreateUserFoodInput = z.infer<typeof createUserFoodSchema>;
export type MealItemDraftInput = z.infer<typeof mealItemDraftSchema>;
export type CreateMealSessionInput = z.infer<typeof createMealSessionSchema>;
export type CreateRetailChainInput = z.infer<typeof createRetailChainSchema>;
export type CreateRetailItemInput = z.infer<typeof createRetailItemSchema>;
export type CreateRetailUserItemInput = z.infer<typeof createRetailUserItemSchema>;
export type UpsertUserGoalsInput = z.infer<typeof upsertUserGoalsSchema>;
```

### File: `lib/nutrition/types.ts`

```typescript
export interface NutrientProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  items: MealItemDraft[];
}

export interface NutritionBootstrap {
  userFoods: NutritionUserFoodView[];
  retailChains: RetailChainView[];
  goals: NutritionUserGoalsView | null;
}

export interface NutritionUserGoalsView {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  microGoals: Record<string, { target: number; unit: string }> | null;
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
```

### File: `lib/nutrition/index.ts`

Barrel export:

```typescript
export * from "./schemas";
export * from "./types";
```

---

## 7. Client State & localStorage Persistence

### File: `lib/nutrition/mealDraftStore.ts`

Follow the same pattern as gym's `WorkoutFlow.tsx` (lines 30–67) and meds' `MedicationFlow.tsx` (lines 76–118).

```typescript
import type { MealItemDraft } from "./types";

const STORAGE_KEY = "apexion-meal-session";
const STORAGE_VERSION = 1;

interface PersistedMealState {
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedMealState(state: PersistedMealState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — silently fail */ }
}

export function clearPersistedMealState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

The `NutritionFlow.tsx` component will:
- Call `loadPersistedMealState()` on mount (in a `useEffect` with a `hasRestored` ref, same as gym)
- Call `savePersistedMealState()` whenever state changes (in a `useEffect` depending on state values)
- Call `clearPersistedMealState()` on successful submit or discard

---

## 8. UI — Meal Logging Flow (`/logmeal`)

### File: `app/logmeal/page.tsx` (rewrite)

Server component that fetches bootstrap data and renders the client flow:

```tsx
import { getNutritionBootstrapAction } from "@/actions/nutrition";
import { NutritionFlow } from "@/components/nutrition/NutritionFlow";

export default async function LogMealPage() {
  const bootstrap = await getNutritionBootstrapAction();
  return <NutritionFlow bootstrap={bootstrap} />;
}
```

### File: `components/nutrition/NutritionFlow.tsx` (new, replaces old flow)

This is the main orchestrator component (~400–600 lines), following the pattern of `WorkoutFlow.tsx` and `MedicationFlow.tsx`.

**State:**
```typescript
const [activeTab, setActiveTab] = useState<"food" | "restaurant">("food");
const [stagedItems, setStagedItems] = useState<MealItemDraft[]>([]);
const [mealLabel, setMealLabel] = useState<string | null>(null);
const [sessionDate, setSessionDate] = useState<string>(todayIso());
const [sessionTime, setSessionTime] = useState<string>(nowTime());
const [useManualTimestamp, setUseManualTimestamp] = useState(false);
const [sheetOpen, setSheetOpen] = useState(false);
const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
const hasRestored = useRef(false);
```

**localStorage integration:**
```typescript
// Restore on mount
useEffect(() => {
  if (hasRestored.current) return;
  hasRestored.current = true;
  const persisted = loadPersistedMealState();
  if (persisted) {
    setStagedItems(persisted.items);
    setMealLabel(persisted.mealLabel);
    // ... restore all fields
  }
}, []);

// Persist on change
useEffect(() => {
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
```

**Layout:**
```
┌─────────────────────────────────────────┐
│  Header: "Log Meal"    [Sheet trigger]  │
│─────────────────────────────────────────│
│  [ Food ]  [ Restaurants ]   ← Tabs    │
│─────────────────────────────────────────│
│                                         │
│  Tab content (search, results, etc.)    │
│                                         │
└─────────────────────────────────────────┘
```

**Header:** Use the `MobileHeaderContext` pattern. The Sheet trigger in the header shows a badge with `stagedItems.length` when > 0.

**Tabs:** Use the `Tabs` primitive from `components/ui_primitives/tabs.tsx`. Two tabs: "Food" and "Restaurants".

**Adding an item flow:**
1. User taps a food item from search results
2. `FoodDetailDialog` opens showing nutrition facts
3. For foundation foods: a **portion dropdown** (e.g., "1 large", "1 cup", "100g") that recalculates displayed nutrients based on `portionGramWeight / 100`
4. For complex / retail foods: serving count input (NumberInput, default 1)
5. User taps "Add to Meal"
6. Item appended to `stagedItems` as a `MealItemDraft` (nutrients stored are per-serving values; the service layer will multiply by servings when persisting)
7. Toast: "[Food name] added to meal"

**Submit flow:**
1. User opens MealOverviewSheet, taps "Save Meal"
2. Construct `CreateMealSessionInput` from state
3. Call `createMealSessionAction(input)`
4. On success: `clearPersistedMealState()`, toast "Meal logged", `router.push("/")`

---

## 9. UI — MealOverviewSheet (Staging Area)

### File: `components/nutrition/MealOverviewSheet.tsx`

A right-side `Sheet` matching `SessionOverviewSheet.tsx` and `MedicationOverviewSheet.tsx`.

**Props:**
```typescript
interface MealOverviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MealItemDraft[];
  mealLabel: string | null;
  onMealLabelChange: (label: string | null) => void;
  sessionDate: string;
  onSessionDateChange: (date: string) => void;
  sessionTime: string;
  onSessionTimeChange: (time: string) => void;
  useManualTimestamp: boolean;
  onUseManualTimestampChange: (manual: boolean) => void;
  onRemoveItem: (index: number) => void;
  onUpdateServings: (index: number, servings: number) => void;
  onSaveSession: () => void;
  onDiscardSession: () => void;
  submitting: boolean;
}
```

**UI layout (top to bottom):**

1. **Meal label** — Select with options: Breakfast, Lunch, Dinner, Snack (or null for unspecified)
2. **Timestamp controls** — Toggle for manual vs "now". When manual: date picker + time picker. Same pattern as `MedicationOverviewSheet`.
3. **Staged items list** — Each item shows:
   - Food name (+ brand if present)
   - Source badge: "Foundation" / "My Food" / restaurant chain name
   - Portion label if foundation (e.g., "1 large")
   - Servings count with +/- buttons (using NumberInput)
   - Per-item macro summary: `Cal • P • C • F`
   - Remove button (X icon)
4. **Totals bar** — Fixed at bottom of the item list area, sums all items:
   - Total Calories, Protein (g), Carbs (g), Fat (g)
5. **Action buttons:**
   - "Discard" (destructive variant, with AlertDialog confirmation)
   - "Save Meal" (primary, disabled when `items.length === 0` or `submitting`)

---

## 10. UI — Food Tab (Complex + Foundation)

### File: `components/nutrition/FoodSearch.tsx`

The search component for the Food tab. Occupies the full tab content area.

**Layout:**
```
┌──────────────────────────────────────┐
│  [ Search foods... ]                 │
│  [Scan Label]  [Add Manually]        │
│──────────────────────────────────────│
│  My Foods (2 results)                │
│    ┌──────────────────────────────┐  │
│    │ Kirkland Protein Bar  200cal │  │
│    └──────────────────────────────┘  │
│    ┌──────────────────────────────┐  │
│    │ Kodiak Waffles         190cal│  │
│    └──────────────────────────────┘  │
│  Foundation Foods (5 results)        │
│    ┌──────────────────────────────┐  │
│    │ Egg, whole, raw        143cal│  │
│    └──────────────────────────────┘  │
│    ...                               │
└──────────────────────────────────────┘
```

**Behavior:**
1. Search input with debounce (300ms)
2. On query change (min 2 chars), call `searchFoodsAction(query)`
3. Results displayed grouped by source:
   - **"My Foods"** — user's complex foods (from `NutritionUserFood`)
   - **"Foundation Foods"** — USDA foundation foods
4. Each result card shows: name, brand (if any), calories per serving
5. Tapping a result opens `FoodDetailDialog`
6. When search is empty: show recent/frequent user foods (optional enhancement, not required for v1)

**Action buttons:**
- **"Scan Label"** — opens `LabelScanner` dialog
- **"Add Manually"** — opens `ManualFoodForm` dialog

### File: `components/nutrition/FoodResultCard.tsx`

A compact card for search results. Shows:
- Food name (bold)
- Brand or source label (muted)
- Calories per serving (right-aligned)
- Tap handler → opens detail dialog

### File: `components/nutrition/FoodDetailDialog.tsx`

A `Dialog` showing full food details and serving selection.

**For foundation foods:**
```
┌────────────────────────────────────┐
│        Egg, whole, raw             │
│        Foundation Food             │
│────────────────────────────────────│
│  Portion: [1 large (50g)    ▼]    │
│  Servings: [ 2 ]                   │
│────────────────────────────────────│
│  Nutrition Facts (per selection)   │
│  Calories     143 kcal             │
│  Protein      12.6 g              │
│  Carbs        0.7 g               │
│  Fat          9.5 g               │
│  ───────────                       │
│  Cholesterol  372 mg               │
│  Sodium       142 mg               │
│  ... (all available nutrients)     │
│────────────────────────────────────│
│         [ Add to Meal ]            │
└────────────────────────────────────┘
```

- **Portion dropdown** (Select primitive): populated from the food's `portions` array. Each option shows `"{amount} {unit}"` (e.g., "1 large", "1 cup chopped"). When a portion is selected, the gram weight is used to recalculate nutrients: `nutrientPer100g * gramWeight / 100`.
- Default to the first portion if available, else "100g".
- **Servings** (NumberInput): multiplier applied on top of the portion.
- **Displayed nutrients**: recalculated live as portion/servings change.

**For complex and retail foods:**
- No portion dropdown (these have a fixed serving size)
- Just a servings input
- Otherwise same layout

**"Add to Meal" button:**
1. Construct a `MealItemDraft`:
   - `foodSource`: "foundation", "complex", or "retail"
   - `foundationFoodId` or `sourceFoodId` as applicable
   - `snapshotName`: food name
   - `servings`: the user's input
   - `portionLabel`: selected portion label (foundation only)
   - `portionGramWeight`: selected portion gram weight (foundation only)
   - `nutrients`: the **per-serving** nutrient values (already scaled to the portion for foundation foods)
2. Call the `onAddItem` prop passed from `NutritionFlow`
3. Close the dialog

### File: `components/nutrition/ManualFoodForm.tsx`

A `Dialog` containing a form for manually creating a complex food item.

**Fields:**
- Name (required)
- Brand (optional)
- Serving size + unit (required, defaults: 1 serving / "serving")
- **Required macros:** Calories, Protein (g), Carbs (g), Fat (g)
- **Optional micros** (collapsible "More Nutrients" section):
  - Saturated Fat, Trans Fat, Fiber, Sugars, Added Sugars
  - Cholesterol, Sodium, Calcium, Iron, Potassium
  - Vitamin A, Vitamin C, Vitamin D
- Ingredients text (optional textarea)

All number inputs use the `NumberInput` component (type="tel", inputMode="decimal").

**On submit:**
1. Validate with `createUserFoodSchema`
2. Call `createUserFoodAction(input)` — saves to user's food database
3. Automatically construct a `MealItemDraft` from the created food and add it to the staging
4. Toast: "[Food name] created and added to meal"
5. Close dialog

---

## 11. UI — Label Scanning (OCR)

### File: `components/nutrition/LabelScanner.tsx`

A `Dialog` for scanning nutrition labels via camera or image upload.

**Flow:**

**Step 1: Capture**
```
┌────────────────────────────────────┐
│        Scan Nutrition Label        │
│────────────────────────────────────│
│                                    │
│   [ 📷 Take Photo ]               │
│   [ 📁 Upload Image ]             │
│                                    │
└────────────────────────────────────┘
```

- "Take Photo" → `<input type="file" accept="image/*" capture="environment">` (hidden, triggered by button click)
- "Upload Image" → `<input type="file" accept="image/*">` (hidden, triggered by button click)
- Both use hidden `<input>` refs triggered programmatically

**Step 2: Processing**
```
┌────────────────────────────────────┐
│        Scan Nutrition Label        │
│────────────────────────────────────│
│   ┌────────────────────────────┐   │
│   │    [image preview]         │   │
│   └────────────────────────────┘   │
│                                    │
│   Extracting nutrition data...     │
│   [spinner]                        │
└────────────────────────────────────┘
```

- After file selection, convert to base64 using `FileReader.readAsDataURL`
- Show image preview (small thumbnail)
- Call `extractNutritionLabelAction(base64String)`

**Step 3: Review & Save**
- On success: dialog content transitions to an **editable form** pre-filled with OCR results
- This form is essentially `ManualFoodForm` in "edit" mode, pre-populated with the extracted data
- User can correct any OCR errors, add a name if not extracted
- "Save & Add to Meal" button:
  1. `createUserFoodAction(input)` — saves to user's food database
  2. Add `MealItemDraft` to staging
  3. Close dialog

**Error handling:**
- If OCR fails: show error message with "Try Again" and "Enter Manually" buttons
- "Enter Manually" opens the blank `ManualFoodForm`

---

## 12. UI — Restaurant Tab (Retail)

### File: `components/nutrition/RetailFlow.tsx`

Two-step flow occupying the Restaurant tab content area.

**Step 1: Chain Selection**
```
┌──────────────────────────────────────┐
│  Select a Restaurant                 │
│──────────────────────────────────────│
│  ┌─────────┐  ┌─────────┐           │
│  │Chipotle │  │McDonald │           │
│  │         │  │         │           │
│  └─────────┘  └─────────┘           │
│  ┌─────────┐  ┌─────────┐           │
│  │Taco Bell│  │Panda Exp│           │
│  │         │  │         │           │
│  └─────────┘  └─────────┘           │
│  ...                                 │
└──────────────────────────────────────┘
```

- Display chains from `bootstrap.retailChains` as a grid of tappable cards
- Each card shows the chain name
- Tapping a chain → sets `selectedChainId` and moves to Step 2
- Back button at top of Step 2 returns to chain selection

**Step 2: Menu Search**
```
┌──────────────────────────────────────┐
│  ← Chipotle                         │
│──────────────────────────────────────│
│  [ Search menu items... ]            │
│──────────────────────────────────────│
│  ┌──────────────────────────────┐    │
│  │ Chicken Burrito Bowl  665cal │    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │ Steak Burrito        925cal  │    │
│  └──────────────────────────────┘    │
│  ...                                 │
│──────────────────────────────────────│
│  Can't find it? [Add Item]           │
└──────────────────────────────────────┘
```

- Search input with debounce (300ms)
- Call `searchRetailItemsAction(chainId, query)` — returns both global and user items, tagged with `isUserItem`
- Results use `FoodResultCard` (same as Food tab, reused)
- Tapping a result → opens `FoodDetailDialog` (same component, reused)
- User items are visually distinguished (subtle badge or different background)

**"Can't find it?" flow:**
- Below results or when results are empty
- "Add Item" button opens `RetailItemCreator` dialog

### File: `components/nutrition/RetailItemCreator.tsx`

A `Dialog` for adding a missing restaurant item to the user's personal retail database.

**Two options:**
1. **"Scan/Upload"** — Uses the same camera/upload flow as `LabelScanner`, but calls `extractNutritionLabelAction` and saves via `createRetailUserItemAction` instead of `createUserFoodAction`
2. **"Enter Manually"** — Simplified form: name + required macros (calories, protein, carbs, fat) + optional micros

**On save:**
1. Call `createRetailUserItemAction({ chainId, name, nutrients, ... })`
2. Construct `MealItemDraft` and add to staging
3. Close dialog, toast confirmation

---

## 13. UI — Chain Data Import (`/logmeal/addchaindata`)

### File: `app/logmeal/addchaindata/page.tsx`

A desktop-focused utility page for bulk-importing restaurant chain nutrition data.

**Layout (wide, desktop):**
```
┌─────────────────────────────────────────────────────────────────────┐
│  Import Restaurant Nutrition Data                                   │
│─────────────────────────────────────────────────────────────────────│
│  Chain: [ Select or Create ▼ ]   [+ New Chain]                      │
│─────────────────────────────────────────────────────────────────────│
│  Upload Images                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                    │
│  │  Page 1 ✓  │  │  Page 2 ✓  │  │  + Add     │                    │
│  └────────────┘  └────────────┘  └────────────┘                    │
│─────────────────────────────────────────────────────────────────────│
│  Extracted Items (24 items)                          [Save All]     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Name              │ Category │ Cal │ Pro │ Carb │ Fat │  ✕  │    │
│  ├───────────────────┼──────────┼─────┼─────┼──────┼─────┼─────│    │
│  │ Chicken Burrito B │ Entrees  │ 665 │ 42  │ 72   │ 22  │  ✕  │    │
│  │ Steak Burrito     │ Entrees  │ 925 │ 45  │ 95   │ 35  │  ✕  │    │
│  │ ...               │          │     │     │      │     │     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  [+ Add Item Manually]       [Download JSON]        [Save All]      │
└─────────────────────────────────────────────────────────────────────┘
```

**Flow:**

1. **Select or create chain**
   - Combobox (Popover + Command) populated with existing chains from `listRetailChains`
   - "Create New" option → calls `createRetailChainAction({ name })`, adds to list

2. **Upload images**
   - Multiple file upload area (multi-select or add one at a time)
   - Each uploaded image gets processed independently via `extractRetailMenuAction(base64, chainName)`
   - Progress indicator per image: pending → processing → done / error
   - Results from all images are merged into a single editable table

3. **Review table**
   - Editable inline cells for name, category, macros
   - Delete row button per item
   - "Add Item Manually" button → appends a blank editable row
   - All cells are inputs (no need for react-hook-form; just controlled state)

4. **Save**
   - "Save All" → calls `bulkCreateRetailItemsAction(chainId, items)`
   - Toast: "24 items saved to [Chain Name]"
   - Clear the table

5. **Download JSON**
   - Generates a JSON file from the table data
   - Uses `URL.createObjectURL` + `<a>` download trick
   - File saved as `[chain-key]-nutrition.json`
   - This JSON can be committed to `docs/provenance/nutrition/` for version control

---

## 14. UI — Meals History Page (`/meals`)

### File: `app/meals/page.tsx` (rewrite)

Server component that fetches meal data:

```tsx
import { listMealSessionsAction } from "@/actions/nutrition";
import { MealsList } from "@/components/nutrition/MealsList";

export default async function MealsPage() {
  const sessions = await listMealSessionsAction();
  return <MealsList initialSessions={sessions} />;
}
```

### File: `components/nutrition/MealsList.tsx` (rewrite)

Client component for displaying, editing, and deleting meals.

**Layout:**
```
┌──────────────────────────────────────┐
│  Your Meals                          │
│──────────────────────────────────────│
│  March 1, 2026                       │
│  ┌──────────────────────────────┐    │
│  │ Lunch • 12:30 PM             │    │
│  │ Chicken Burrito Bowl (1)     │    │
│  │ Chips & Guac (1)             │    │
│  │ Cal: 920 • P: 48g • C: 88g  │    │
│  │              [Edit] [Delete] │    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │ Breakfast • 8:00 AM          │    │
│  │ Eggs (2 large)               │    │
│  │ Toast (1)                    │    │
│  │ Cal: 420 • P: 22g • C: 36g  │    │
│  │              [Edit] [Delete] │    │
│  └──────────────────────────────┘    │
│                                      │
│  February 28, 2026                   │
│  ...                                 │
└──────────────────────────────────────┘
```

**Grouping:** Sessions grouped by `dateStr`, sorted newest first. Date headers with human-readable format.

**Each meal card shows:**
- Meal label + time (derived from `loggedAtIso`)
- List of item names with servings and portion labels
- Total macros (sum of snapshot values)
- Edit and Delete buttons

**Edit flow:**
- "Edit" opens a `Dialog` with:
  - Meal label (Select)
  - Date and time (pickers)
  - List of items:
    - Name displayed (read-only)
    - Servings (editable NumberInput)
    - Remove button (X)
  - Note: Adding new items is NOT supported in edit (keeps it simple; user can log a new meal instead)
  - "Save Changes" → `updateMealSessionAction(sessionId, updatedInput)`
  - On success: update local state, toast, close dialog

**Delete flow:**
- "Delete" opens `AlertDialog` (confirmation): "Delete this meal? This cannot be undone."
- Confirm → `deleteMealSessionAction(sessionId)`
- On success: remove from local state, toast

---

## 15. Homepage Macros Update

### Changes to `actions/InternalLogic.ts`

Replace the DynamoDB macro data fetch with the new Prisma-based query.

**Current** (line 22):
```typescript
macroData = getDataFromTable(userID, "Apexion-Nutrition", startDate, endDate)
```

**New:**
```typescript
macroData = await getMacroSummaryByDateRange(userId, startDate, endDate)
```

**Update the macroData processing loop** (current lines 44–69): The new `getMacroSummaryByDateRange` returns `MacroSummaryByDate[]` — already summed per date. Replace the `forEach` loop that calls `calculateMacrosForMeal` with a simpler loop:

```typescript
macroData.forEach((daySummary) => {
  const existingItem = summaryData.get(daySummary.dateStr);
  const macros = {
    calories: daySummary.calories,
    protein: daySummary.protein,
    carbs: daySummary.carbs,
    fat: daySummary.fat,
  };
  if (existingItem) {
    existingItem.macros = macros;
  } else {
    summaryData.set(daySummary.dateStr, { date: daySummary.dateStr, macros });
  }
});
```

Remove `calculateMacrosFromFoodItems`, `calculateMacrosFromMealItems`, and `calculateMacrosForMeal` functions — they're no longer needed.

### Changes to `app/page.tsx`

**Replace Clerk metadata goals with Prisma goals:**

Current (lines 80–91):
```typescript
useEffect(()=>{
  if(isLoaded) {
    setCalorieLimit(user?.publicMetadata.markers.nutrition.calorieLimit);
    setProteinGoal(user?.publicMetadata.markers.nutrition.proteinGoal);
    setCarbGoal(user?.publicMetadata.markers.nutrition.carbGoal);
    setFatGoal(user?.publicMetadata.markers.nutrition.fatGoal);
  }
},[isLoaded])
```

**New approach:** Include goals in the `homeFetch` response. Add a `getUserGoals(userId)` call inside `homeFetch`, return the goals alongside the summary data. Then in `page.tsx`, read goals from the response instead of Clerk metadata.

Alternatively, call `getUserGoalsAction()` separately in the `dataFetch` function:

```typescript
const [response, goals] = await Promise.all([
  homeFetch({ startDate, endDate }),
  getUserGoalsAction(),
]);
if (goals) {
  setCalorieLimit(goals.calories ?? 0);
  setProteinGoal(goals.protein ?? 0);
  setCarbGoal(goals.carbs ?? 0);
  setFatGoal(goals.fat ?? 0);
}
```

### Goal management UI

The user needs a way to set/update their nutrition goals now that they're in Prisma instead of Clerk.

Add a simple goals section to the meals page or create a settings dialog accessible from the homepage macro section. A small "Settings" gear icon next to the macro charts that opens a `Dialog` with inputs for calorie limit, protein goal, carb goal, fat goal (and extensible for micros later). On save, calls `upsertUserGoalsAction(input)`.

This could also go in `/meals` as a header action.

---

## 16. USDA Foundation Import Script

### File: `scripts/import-usda-foundation.ts`

A script to import USDA foundation food data into the `NutritionFoundationFood` Prisma model. This replaces the existing scripts in `usdaImportScripts/`.

**Prerequisites:** Raw USDA FoodData Central foundation food JSON (downloadable from USDA FDC site). The existing `usdaImportScripts/` directory likely already has this data or the download logic.

**Script behavior:**
1. Read the USDA foundation foods JSON file
2. For each food:
   a. Extract `fdcId`, `description` (→ `name`), `foodCategory.description` (→ `category`)
   b. Extract nutrients array → convert to `NutrientProfile` JSON using USDA nutrient ID mapping:
      - 1008 → calories (Energy, kcal)
      - 1003 → protein
      - 1005 → carbs (Carbohydrate, by difference)
      - 1004 → fat (Total lipid)
      - 1258 → saturatedFat
      - 1257 → transFat
      - 1079 → fiber
      - 1063 → sugars (Total sugars)
      - 1253 → cholesterol
      - 1093 → sodium
      - 1087 → calcium
      - 1089 → iron
      - 1092 → potassium
      - 1106 → vitaminA (RAE)
      - 1162 → vitaminC
      - 1114 → vitaminD (D2 + D3)
   c. Extract food portions → convert to `FoundationFoodPortion[]` JSON
   d. Set `defaultServingSize` = 100, `defaultServingUnit` = "g"
3. Upsert into `NutritionFoundationFood` (on `fdcId` unique constraint) in batches of 100
4. Log progress and final count

**Run command** (add to `package.json` scripts):
```json
"seed:usda-foundation": "tsx scripts/import-usda-foundation.ts"
```

### Cleanup

Delete the contents of `usdaImportScripts/` or the entire directory once the new script is confirmed working.

---

## 17. Migration & Cleanup

### Prisma migration

After updating `schema.prisma`:

```bash
npx prisma migrate dev --name add-nutrition-models
npx prisma generate
```

Then create the trigram index for foundation food search (in a follow-up migration or raw SQL):

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_foundation_food_name_trgm
  ON "NutritionFoundationFood" USING gin (name gin_trgm_ops);
```

### Files to delete

| File/Directory | Reason |
|------|--------|
| `context/MealFormContext.tsx` | Replaced by parent state + localStorage |
| `app/logmealOLD/` | Legacy, no longer needed |
| `app/logmeal/addcustomfood/` | Replaced by in-page ManualFoodForm dialog |
| `components/nutrition/FoodItem.tsx` | Replaced by FoodResultCard |
| `components/nutrition/FoodItemCards.tsx` | Replaced by FoodSearch |
| `components/nutrition/FoodItemDrawer.tsx` | Replaced by FoodDetailDialog |
| `components/nutrition/CustomFoodCard.tsx` | Replaced by ManualFoodForm |
| `components/nutrition/CustomFoodForm.tsx` | Replaced by ManualFoodForm |
| `components/nutrition/FoodForm.tsx` | Replaced by NutritionFlow |
| `components/nutrition/MealSheet.tsx` | Replaced by MealOverviewSheet |
| `components/nutrition/foodUtils.ts` | Logic moved to service layer |
| `actions/USDAlocal.ts` | Raw SQL queries replaced by Prisma service |
| `actions/AWSmigration.ts` | DynamoDB migration no longer relevant |

### Files to modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add all nutrition models |
| `actions/InternalLogic.ts` | Replace DynamoDB macro fetch with Prisma query, remove `calculateMacros*` functions |
| `app/page.tsx` | Read goals from Prisma instead of Clerk metadata |
| `package.json` | Add `openai` dependency, add `seed:usda-foundation` script |
| `components/nutrition/MealsList.tsx` | Full rewrite |
| `app/logmeal/page.tsx` | Full rewrite |
| `app/meals/page.tsx` | Full rewrite |

### Files NOT to touch

| File | Reason |
|------|--------|
| `components/global/MobileNav.tsx` | `/meals` link and `/logmeal` log entry already exist |
| `utils/types.ts` | Old types still used by non-nutrition code; leave until broader cleanup |
| `utils/newtypes.ts` | Same — will become dead code but no harm leaving it |
| `actions/AWS.ts` | Still used by non-nutrition DynamoDB operations (hormones, etc.) |

---

## 18. File Manifest

### New files to create

```
lib/ocr/extractStructuredData.ts           — Generic OCR primitive (reusable for labs later)
lib/ocr/extractNutritionLabel.ts           — Nutrition label OCR wrapper
lib/ocr/extractRetailMenuData.ts           — Retail menu OCR wrapper
lib/ocr/index.ts                           — Barrel export

lib/nutrition/nutrientKeys.ts              — Shared nutrient key constants
lib/nutrition/schemas.ts                   — Zod validation schemas
lib/nutrition/types.ts                     — TypeScript types
lib/nutrition/index.ts                     — Barrel export
lib/nutrition/mealDraftStore.ts            — localStorage persistence helpers
lib/nutrition/server/nutritionService.ts   — Prisma service layer (all DB operations)

actions/nutrition.ts                       — Server actions for all nutrition operations
actions/ocr.ts                             — OCR server actions

components/nutrition/NutritionFlow.tsx     — Main orchestrator (replaces FoodForm + Context)
components/nutrition/MealOverviewSheet.tsx  — Staging area sheet
components/nutrition/FoodSearch.tsx         — Food tab search + grouped results
components/nutrition/FoodResultCard.tsx     — Compact food search result card
components/nutrition/FoodDetailDialog.tsx   — Food detail + portion/serving selection + add
components/nutrition/ManualFoodForm.tsx     — Manual food creation dialog
components/nutrition/LabelScanner.tsx       — OCR label scanning dialog
components/nutrition/RetailFlow.tsx         — Restaurant tab (chain picker + menu search)
components/nutrition/RetailItemCreator.tsx  — User retail item creation dialog
components/nutrition/MealsList.tsx          — Full rewrite of meals history list

app/logmeal/page.tsx                       — Rewrite: server component loading bootstrap
app/logmeal/addchaindata/page.tsx          — New: chain data import (desktop-focused)
app/meals/page.tsx                         — Rewrite: server component loading sessions

scripts/import-usda-foundation.ts          — USDA foundation data import script
```

### Implementation order

Recommended build sequence:

1. **Schema + migration** — Add all models to `schema.prisma`, run `prisma migrate dev`, generate client
2. **Types + schemas + constants** — `lib/nutrition/` types, schemas, nutrientKeys, index
3. **Service layer** — `nutritionService.ts` (all CRUD functions, transaction logic)
4. **Server actions** — `actions/nutrition.ts`, `actions/ocr.ts`
5. **OCR primitive** — `lib/ocr/` (extractStructuredData, extractNutritionLabel, extractRetailMenuData)
6. **localStorage persistence** — `mealDraftStore.ts`
7. **NutritionFlow + MealOverviewSheet** — Core staging UI with tab structure
8. **FoodSearch + FoodResultCard + FoodDetailDialog** — Food tab with portion dropdown
9. **ManualFoodForm** — Manual food creation dialog
10. **LabelScanner** — OCR label scanning dialog
11. **RetailFlow + RetailItemCreator** — Restaurant tab with chain picker and menu search
12. **Chain data import page** — `/logmeal/addchaindata` (desktop-focused)
13. **Meals history page** — `/meals` rewrite with edit/delete
14. **Homepage macros update** — Update `InternalLogic.ts` + `page.tsx` for Prisma goals
15. **USDA import script** — `scripts/import-usda-foundation.ts`
16. **Cleanup** — Delete old files, remove dead code
