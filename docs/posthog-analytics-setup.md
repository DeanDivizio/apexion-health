# PostHog Analytics Setup

## Overview

PostHog is integrated for both product analytics and LLM analytics. The setup uses:
- `posthog-js` for client-side event capture
- `posthog-node` for server-side event capture (API routes, server actions)
- `@posthog/ai` for automatic LLM generation tracking

---

## Phase 1: Product Analytics

### Configuration

| File | Purpose |
|---|---|
| `instrumentation-client.ts` | Initializes `posthog-js` on the client (Next.js App Router pattern) |
| `lib/posthog-server.ts` | Singleton `PostHog` (posthog-node) client for server-side use |
| `components/global/PostHogIdentifier.tsx` | Client component that calls `posthog.identify()` via Clerk's `useUser` hook |
| `next.config.mjs` | Reverse-proxy rewrites (`/ingest/*` → PostHog hosts) |

### Environment Variables

```
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=<ph_project_token>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### User Identification

`PostHogIdentifier` is rendered inside `ClerkProvider` in `app/layout.tsx`. When a user is signed in via Clerk, it calls `posthog.identify(userId, { email, name })`. On sign-out it calls `posthog.reset()`.

### Tracked Events

| Event | File | Trigger |
|---|---|---|
| `food_item_added` | `components/nutrition/NutritionFlow.tsx` | User adds a food item to a meal |
| `nutrition_user_food_created` | `components/nutrition/ManualFoodForm.tsx` | User creates a custom food and adds it to a meal |
| `nutrition_retail_item_created` | `components/nutrition/RetailItemCreator.tsx` | User creates a missing retail item and adds it to a meal |
| `meal_logged` | `components/nutrition/NutritionFlow.tsx` | User saves a meal session |
| `medication_item_staged` | `components/meds/MedicationFlow.tsx` | User stages a substance entry before saving |
| `medication_logged` | `components/meds/MedicationFlow.tsx` | User logs medications/supplements |
| `medication_preset_saved` | `components/meds/MedicationFlow.tsx` | User saves a medication preset |
| `medication_preset_applied` | `components/meds/MedicationFlow.tsx` | User applies a saved medication preset to staged items |
| `medication_preset_logged` | `components/meds/MedicationFlow.tsx` | User logs from a saved preset |
| `substance_created` | `components/meds/MedicationFlow.tsx` | User creates a custom substance |
| `workout_exercise_staged` | `components/gym/WorkoutFlow.tsx` | User stages an exercise in a workout |
| `workout_session_logged` | `components/gym/WorkoutFlow.tsx` | User saves a new workout session |
| `workout_session_updated` | `app/gymsessions/page.tsx` | User saves a gym session |
| `workout_session_deleted` | `app/gymsessions/page.tsx` | User deletes a gym session |
| `hydration_logged` | `components/hydration/LogHydrationDialog.tsx` | User logs hydration intake |
| `whoop_connect_initiated` | `app/connect/whoop/page.tsx` | User clicks "Connect to Whoop" |
| `whoop_connected` | `app/api/auth/whoop/callback/route.ts` | Whoop OAuth callback succeeds (server-side) |
| `whoop_sync_triggered` | `app/api/sync/whoop/route.ts` | Whoop data sync completes (server-side) |
| `home_settings_saved` | `app/settings/home/page.tsx` | User saves home screen layout preferences |

---

## Phase 2: LLM Analytics

### Configuration

Uses `@posthog/ai` to wrap the OpenAI SDK. This automatically captures `$ai_generation` events (model, input/output tokens, latency, cost) for every LLM call.

**No additional environment variables required** — reuses the existing PostHog token via `getPostHogClient()`.

### Instrumented Files

| File | Change |
|---|---|
| `lib/ocr/extractStructuredData.ts` | Replaced `import OpenAI from "openai"` with `import { OpenAI } from "@posthog/ai"`. Passes `getPostHogClient()` and optional `posthogDistinctId` to the client. |
| `lib/ocr/extractNutritionLabel.ts` | Accepts and forwards `posthogDistinctId` |
| `lib/ocr/extractRetailMenuData.ts` | Accepts and forwards `posthogDistinctId` |
| `actions/ocr.ts` | Passes Clerk `userId` as `posthogDistinctId` so LLM events are linked to the user |

### How It Works

```typescript
// lib/ocr/extractStructuredData.ts
import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  posthog: getPostHogClient(),   // <-- PostHog AI wrapper
});

const response = await client.chat.completions.create({
  model: "gpt-5.2",
  // ...
  posthogDistinctId: req.posthogDistinctId,  // links event to user
});
```

Every call to `extractNutritionLabel` or `extractRetailMenuData` (triggered by OCR features) will automatically produce a `$ai_generation` event in PostHog with model name, token counts, latency, and estimated cost.

### Verify

Navigate to **LLM Analytics → Generations** in PostHog to confirm events appear after running an OCR scan.
