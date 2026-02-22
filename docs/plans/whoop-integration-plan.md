# Whoop Integration - Implementation Plan

> Source: whoopIntegration.md (requirements + Q&A answers)
> Created: 2026-02-21

---

## Architecture Overview

Three-layer data model:
1. **Provider Connection Layer** — Generic, extensible OAuth token + connection state for any provider
2. **Provider Raw Layer** — Whoop-specific tables that mirror the Whoop API shape closely
3. **Canonical Layer** — Apexion's own biometric tables, provider-agnostic, flattened to calendar days

Data flows: Whoop API → Raw tables → Adapter → Canonical tables.
The adapter runs in the same function as raw ingestion, after the raw write succeeds.

---

## Phase 1: Database Schema

### 1A. Provider Connection Tables (extensible)

These tables are provider-agnostic. Future providers (Oura, Garmin, etc.) will reuse them.

```
ProviderConnection
  id            String    @id @default(uuid())
  userId        String                          // Clerk user ID
  provider      String                          // e.g. "whoop", "oura", "garmin"
  providerUserId String?                        // the user's ID on the provider's side
  accessToken   String                          // encrypted at rest by Supabase
  refreshToken  String?
  tokenExpiresAt DateTime?
  scopes        String[]                        // granted scopes
  status        ProviderConnectionStatus        // ACTIVE, EXPIRED, REVOKED, ERROR
  lastSyncAt    DateTime?
  syncCursor    Json?                           // provider-specific pagination cursor
  errorMessage  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId, provider])
  @@index([userId])
  @@index([provider, status])
```

```
enum ProviderConnectionStatus {
  ACTIVE
  EXPIRED
  REVOKED
  ERROR
}
```

### 1B. Whoop Raw Tables

These mirror the Whoop API response shapes closely. All have `whoopUserId` for provider-side foreign keys.

```
WhoopCycle
  id                  String   @id @default(uuid())
  connectionId        String   → ProviderConnection
  whoopCycleId        Int      @unique                // Whoop's integer cycle ID
  whoopUserId         Int
  start               DateTime
  end                 DateTime?
  timezoneOffset      String
  scoreState          String                          // SCORED | PENDING_SCORE | UNSCORABLE
  strain              Float?
  kilojoule           Float?
  averageHeartRate    Int?
  maxHeartRate        Int?
  rawJson             Json                            // full API response for future-proofing
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([connectionId])
  @@index([whoopUserId, start])
```

```
WhoopSleep
  id                          String   @id @default(uuid())
  connectionId                String   → ProviderConnection
  whoopSleepId                String   @unique         // Whoop's UUID
  whoopCycleId                Int
  whoopUserId                 Int
  start                       DateTime
  end                         DateTime
  timezoneOffset              String
  nap                         Boolean
  scoreState                  String
  // Stage summary (time-series grain: durations per stage)
  totalInBedTimeMilli         Int?
  totalAwakeTimeMilli         Int?
  totalNoDataTimeMilli        Int?
  totalLightSleepTimeMilli    Int?
  totalSlowWaveSleepTimeMilli Int?
  totalRemSleepTimeMilli      Int?
  sleepCycleCount             Int?
  disturbanceCount            Int?
  // Sleep needed breakdown
  sleepNeededBaselineMilli    Int?
  needFromSleepDebtMilli      Int?
  needFromRecentStrainMilli   Int?
  needFromRecentNapMilli      Int?
  // Scores
  respiratoryRate             Float?
  sleepPerformancePct         Float?
  sleepConsistencyPct         Float?
  sleepEfficiencyPct          Float?
  rawJson                     Json
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  @@index([connectionId])
  @@index([whoopUserId, start])
  @@index([whoopCycleId])
```

```
WhoopRecovery
  id                  String   @id @default(uuid())
  connectionId        String   → ProviderConnection
  whoopCycleId        Int      @unique
  whoopSleepId        String
  whoopUserId         Int
  scoreState          String
  userCalibrating     Boolean?
  recoveryScore       Float?
  restingHeartRate    Float?
  hrvRmssdMilli       Float?
  spo2Percentage      Float?
  skinTempCelsius     Float?
  rawJson             Json
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([connectionId])
  @@index([whoopUserId])
```

```
WhoopWorkout
  id                  String   @id @default(uuid())
  connectionId        String   → ProviderConnection
  whoopWorkoutId      String   @unique                // Whoop's UUID
  whoopUserId         Int
  start               DateTime
  end                 DateTime
  timezoneOffset      String
  sportName           String
  sportId             Int?
  scoreState          String
  strain              Float?
  averageHeartRate    Int?
  maxHeartRate        Int?
  kilojoule           Float?
  percentRecorded     Float?
  distanceMeter       Float?
  altitudeGainMeter   Float?
  altitudeChangeMeter Float?
  // HR zone durations (time-series: ms per zone)
  zoneZeroMilli       Int?
  zoneOneMilli        Int?
  zoneTwoMilli        Int?
  zoneThreeMilli      Int?
  zoneFourMilli       Int?
  zoneFiveMilli       Int?
  rawJson             Json
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([connectionId])
  @@index([whoopUserId, start])
```

### 1C. Canonical Biometric Tables (provider-agnostic, day-indexed)

These are what the rest of Apexion reads from. They don't know about Whoop.

```
BiometricSleep
  id                          String   @id @default(uuid())
  userId                      String
  dateStr                     String                  // YYYYMMDD — the day this sleep "belongs to"
  provider                    String                  // "whoop" (for traceability, not coupling)
  providerSleepId             String?                 // to trace back to raw
  nap                         Boolean  @default(false)
  start                       DateTime
  end                         DateTime
  totalInBedTimeMilli         Int?
  totalAwakeTimeMilli         Int?
  totalLightSleepTimeMilli    Int?
  totalDeepSleepTimeMilli     Int?
  totalRemSleepTimeMilli      Int?
  sleepCycleCount             Int?
  disturbanceCount            Int?
  sleepNeededMilli            Int?
  respiratoryRate             Float?
  sleepPerformancePct         Float?
  sleepConsistencyPct         Float?
  sleepEfficiencyPct          Float?
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt

  @@unique([userId, providerSleepId])
  @@index([userId, dateStr])
```

```
BiometricRecovery
  id                  String   @id @default(uuid())
  userId              String
  dateStr             String                          // YYYYMMDD
  provider            String
  providerRecoveryRef String?                         // whoop cycle ID as string
  recoveryScore       Float?
  restingHeartRate    Float?
  hrvRmssdMilli       Float?
  spo2Percentage      Float?
  skinTempCelsius     Float?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([userId, dateStr, provider])
  @@index([userId, dateStr])
```

```
BiometricWorkout
  id                  String   @id @default(uuid())
  userId              String
  dateStr             String
  provider            String
  providerWorkoutId   String?
  sportName           String?
  start               DateTime
  end                 DateTime
  strain              Float?
  averageHeartRate    Int?
  maxHeartRate        Int?
  kilojoule           Float?
  distanceMeter       Float?
  zoneZeroMilli       Int?
  zoneOneMilli        Int?
  zoneTwoMilli        Int?
  zoneThreeMilli      Int?
  zoneFourMilli       Int?
  zoneFiveMilli       Int?
  // FK to Apexion gym session (set when user associates)
  gymSessionId        String?  → GymWorkoutSession
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([userId, providerWorkoutId])
  @@index([userId, dateStr])
  @@index([gymSessionId])
```

```
BiometricCycleSummary
  id                  String   @id @default(uuid())
  userId              String
  dateStr             String                          // day the cycle "belongs to" (wake day)
  provider            String
  providerCycleRef    String?
  strain              Float?
  kilojoule           Float?
  averageHeartRate    Int?
  maxHeartRate        Int?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([userId, dateStr, provider])
  @@index([userId, dateStr])
```

```
BiometricBodyMeasurement
  id                  String   @id @default(uuid())
  userId              String
  provider            String
  heightMeter         Float?
  weightKilogram      Float?
  maxHeartRate        Int?
  fetchedAt           DateTime
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([userId, provider])
  @@index([userId])
```

### Cycle-to-Day Mapping Rule

Whoop cycles run sleep-to-sleep. For canonical tables, a cycle's `dateStr` is the **wake day** — the calendar date of the cycle's `end` time (adjusted by timezone offset). This means "Monday's recovery" is the recovery you woke up to on Monday morning, which aligns with how people think about their day.

---

## Phase 2: OAuth2 Flow & Token Management

### 2A. Environment Variables

```
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
WHOOP_REDIRECT_URI=              # e.g. https://apexion.health/api/auth/whoop/callback
NEXT_PUBLIC_WHOOP_CLIENT_ID=     # needed client-side for auth URL construction
```

### 2B. Middleware Update

Add `/api/webhooks/(.*)` to public routes in `middleware.ts` so webhook POSTs from Whoop aren't blocked by Clerk.

### 2C. API Routes (new `app/api/` directory)

```
app/api/
  auth/
    whoop/
      callback/route.ts       — handles OAuth redirect, exchanges code for tokens, stores connection
  webhooks/
    whoop/route.ts            — receives webhook POSTs, verifies HMAC, enqueues processing
```

### 2D. Token Management Service

Location: `lib/providers/token-service.ts`

Responsibilities:
- `getValidToken(userId, provider)` — returns a valid access token, refreshing if expired
- `refreshToken(connectionId)` — calls provider's token endpoint, updates DB
- `revokeToken(connectionId)` — calls provider's revoke endpoint, marks connection REVOKED
- `markConnectionError(connectionId, message)` — sets status to ERROR with message

Token refresh strategy: check `tokenExpiresAt` before each API call. If within 5 minutes of expiry, refresh proactively. This avoids the race condition Whoop warns about with concurrent refresh attempts.

### 2E. OAuth Flow (step by step)

1. User clicks "Connect Whoop" → permission selection screen (client component)
2. User selects desired scopes → app builds authorization URL with those scopes + `offline` + a random 8-char state
3. App stores state in a short-lived cookie for CSRF validation
4. User is redirected to Whoop's authorization URL
5. User approves on Whoop's site → redirected to our callback
6. Callback route: validates state from cookie, exchanges code for tokens, fetches Whoop user profile, creates `ProviderConnection`, redirects to biometrics page
7. Background: triggers initial backfill

---

## Phase 3: Data Sync Engine

### 3A. Whoop API Client

Location: `lib/providers/whoop/api-client.ts`

A thin, typed wrapper around the Whoop v2 API:
- `getCycles(token, params)` → paginated cycle list
- `getSleep(token, sleepId)` → single sleep
- `getSleepCollection(token, params)` → paginated sleep list
- `getRecoveryCollection(token, params)` → paginated recovery list
- `getWorkoutCollection(token, params)` → paginated workout list
- `getUserProfile(token)` → user profile
- `getBodyMeasurements(token)` → body measurements

All methods handle:
- Pagination via `nextToken`
- 429 rate limiting: exponential backoff with jitter, max 5 retries
- 401: triggers token refresh via token service, then retries once

### 3B. Sync Service

Location: `lib/providers/whoop/sync-service.ts`

Core function: `syncWhoopData(connectionId, options?)`

Options:
- `fullBackfill: boolean` — if true, ignores sync cursor, fetches everything
- `dataTypes: string[]` — which data types to sync (default: all)

Flow:
1. Load `ProviderConnection`, get valid token
2. For each data type (cycles, sleep, recovery, workouts, body measurements):
   a. Fetch paginated data from Whoop API (respecting rate limits)
   b. Upsert into raw Whoop tables (idempotent via unique Whoop IDs)
   c. Run adapter to transform and upsert into canonical tables
   d. Update `syncCursor` on connection after each successful page
3. Update `lastSyncAt` on connection
4. Fetch and upsert body measurements (not paginated, single call)

Rate limit strategy:
- Max 25 records per page (Whoop's limit)
- 200ms delay between requests
- On 429: read `Retry-After` header if present, otherwise exponential backoff starting at 1s
- Abort after 3 consecutive 429s and save cursor for next run

### 3C. Adapter Layer

Location: `lib/providers/whoop/adapter.ts`

Functions:
- `adaptWhoopSleep(raw: WhoopSleep, userId: string)` → `BiometricSleep` shape
- `adaptWhoopRecovery(raw: WhoopRecovery, userId: string)` → `BiometricRecovery` shape
- `adaptWhoopWorkout(raw: WhoopWorkout, userId: string)` → `BiometricWorkout` shape
- `adaptWhoopCycle(raw: WhoopCycle, userId: string)` → `BiometricCycleSummary` shape
- `adaptWhoopBody(raw, userId: string)` → `BiometricBodyMeasurement` shape

Key transformation: `dateStr` derivation.
- For sleep: the date portion of `end` adjusted by `timezoneOffset` (the day you woke up)
- For recovery: same as its linked sleep's date
- For workouts: the date portion of `start` adjusted by `timezoneOffset`
- For cycles: the date portion of `end` adjusted by `timezoneOffset`

### 3D. Webhook Handler

Location: `app/api/webhooks/whoop/route.ts`

Flow:
1. Read raw body and headers (`X-WHOOP-Signature`, `X-WHOOP-Signature-Timestamp`)
2. Verify HMAC-SHA256 signature: `base64(HMAC-SHA256(timestamp + rawBody, clientSecret))`
3. If invalid → 401
4. Parse body: `{ user_id, id, type, trace_id }`
5. Find `ProviderConnection` by `providerUserId = user_id` and `provider = "whoop"`
6. If no connection or status != ACTIVE → 200 (acknowledge but ignore)
7. Based on `type`:
   - `sleep.updated` → fetch sleep by ID, upsert raw, adapt to canonical
   - `sleep.deleted` → soft-delete or remove raw + canonical
   - `recovery.updated` → fetch recovery for cycle, upsert raw, adapt
   - `recovery.deleted` → remove raw + canonical
   - `workout.updated` → fetch workout by ID, upsert raw, adapt
   - `workout.deleted` → remove raw + canonical
8. Return 200 immediately (process async if needed, but given small payload, sync is fine)

Deduplication: use `trace_id` — store recent trace IDs in a short-lived cache or check before processing.

### 3E. Background Backfill Trigger

After OAuth callback creates the connection, trigger backfill. Options:
- **Server action** that calls `syncWhoopData(connectionId, { fullBackfill: true })` — runs as a long server action. May time out on Vercel if there's a LOT of data. Don't do this.
- **Better**: Use a dedicated API route `app/api/sync/whoop/route.ts` that the callback redirects through or calls via fetch. This route can stream progress.
- **Best for production**: A queue/background job. But for now, a fire-and-forget fetch to the sync route is pragmatic. The sync service saves cursor after each page, so if it times out, subsequent syncs pick up where it left off.

We'll go with the cursor-based resumable approach. The initial sync might take multiple runs if there's a lot of data, but it will converge.

### 3F. Reconciliation

Whoop recommends a reconciliation job since webhooks can be missed. Implement a simple server action or cron-like trigger:
- `reconcileWhoopData(userId)` — calls sync service with `fullBackfill: false` (uses cursor for incremental sync)
- Can be triggered manually from the biometrics page or on a schedule later

---

## Phase 4: UI

### 4A. Permission Selection Screen

Location: `app/connect/whoop/page.tsx`

A client page shown before the OAuth redirect:
- Title: "Connect Whoop"
- Explanation of what Apexion will access and why
- Checkboxes for each scope category (all checked by default):
  - Sleep data — "Correlate sleep patterns with your training, nutrition, medicine, and recovery"
  - Recovery data — "Track HRV, RHR, and readiness alongside your regimen"
  - Workout data — "Associate heart rate and strain with your gym sessions"
  - Cycle data — "Daily strain and physiological cycle tracking"
  - Body measurements — "Sync weight and height without manual entry"
  - Profile — "Verify your Whoop identity"
- "We recommend granting all permissions for the best experience" banner
- "Connect" button → constructs OAuth URL with selected scopes and redirects

### 4B. Biometrics Page

Location: `app/biometrics/page.tsx`

Layout: Similar to gym sessions page — mobile-first, cards, accordion-style.
Data: Grouped by day (dateStr), most recent first.

For each day, show:
- **Sleep card**: time in bed, time asleep, stage breakdown (light/deep/REM/awake as colored bar or simple list), respiratory rate, sleep performance %, efficiency %, disturbance count
- **Recovery card**: recovery score (color-coded: green >67, yellow 34-66, red <33), RHR, HRV, SpO2 (if available), skin temp (if available)
- **Cycle summary card**: total strain, total kJ, avg/max HR

Naps shown separately under the main sleep for that day.

Header: "Biometrics" with SideNav on left, standard layout.

### 4C. Home Page Summary

Location: Modify `app/page.tsx`

Insert below the macro ring charts grid and above the "Recent Days" section:
- A compact row/card showing today's key biometrics:
  - Recovery score (with color)
  - HRV
  - RHR
  - Last night's sleep duration + performance %
- If no data yet today: show yesterday's or "No data yet"
- If Whoop not connected: show a subtle "Connect Whoop" CTA

Data: Fetched in `homeFetch` alongside existing data. Add a biometrics fetch for today's canonical data.

### 4D. Gym Session Workout Association

Location: Modify `app/gymsessions/` components

On each `SessionCard`, if there are BiometricWorkout records whose time window overlaps the session's start/end time:
- Show a "Whoop Data" section in the expanded card:
  - Avg HR, Max HR, Strain, kJ burned
  - HR zone breakdown (as colored bars or simple list)
  - Distance (if applicable)
- If multiple Whoop workouts overlap, show all and let the user confirm which one matches

For the initial backfill, workout associations are NOT auto-created. Instead:
- After backfill, on the gym sessions page, show an "Associate Whoop Data" button on sessions that have potential time-overlap matches
- User taps → sees the candidate Whoop workout(s) → confirms → `gymSessionId` is set on the BiometricWorkout record

### 4E. Syncing Indicator

Location: Modify `components/global/MobileHeader.tsx`

When a sync is in progress (tracked via a context or simple state):
- Show a subtle animated indicator (e.g., a small pulsing dot or rotating icon) in the center area of the mobile header, below the "Apexion" branding
- Disappears when sync completes

Implementation: A `SyncStatusContext` that the sync trigger sets, and MobileHeader reads.

### 4F. SideNav Link

Location: Modify `components/global/SideNav.tsx`

Add under Collections:
- `<Link href="/biometrics">` with a Heart/Activity icon — "Biometrics"

### 4G. Connection Status Banner

When the provider connection status is ERROR or EXPIRED:
- Show a banner at the top of the biometrics page: "Whoop connection lost. Reconnect to resume syncing."
- The banner links back to the connect flow

---

## Phase 5: Connection Management

### 5A. Disconnect Flow

Location: Settings page or biometrics page

- "Disconnect Whoop" button
- Calls server action → revokes token via Whoop API → marks connection REVOKED
- Existing data is kept (per requirements)
- Webhooks automatically stop (Whoop stops sending when token is revoked)

### 5B. Reconnect Flow

Same as initial connect — user goes through OAuth again. Since `ProviderConnection` has `@@unique([userId, provider])`, the existing row is updated rather than duplicated.

### 5C. Scope Management

If user wants to change what they share later:
- Disconnect and reconnect with different scopes
- Or: we store granted scopes and on reconnect, pre-check the previously selected ones

---

## File Structure (new files)

```
app/
  api/
    auth/
      whoop/
        callback/route.ts
    webhooks/
      whoop/route.ts
    sync/
      whoop/route.ts
  biometrics/
    page.tsx
    components/
      SleepCard.tsx
      RecoveryCard.tsx
      CycleSummaryCard.tsx
      DayGroup.tsx
  connect/
    whoop/
      page.tsx

lib/
  providers/
    types.ts                        // shared provider types
    token-service.ts                // generic token management
    whoop/
      api-client.ts                 // typed Whoop API wrapper
      sync-service.ts               // backfill + incremental sync
      adapter.ts                    // raw → canonical transformation
      types.ts                      // Whoop-specific types

actions/
  biometrics.ts                     // server actions for biometrics pages
  providers.ts                      // server actions for connection management

context/
  SyncStatusContext.tsx              // sync progress state
```

---

## Implementation Order

This is the order I'll build things in. Each step is a meaningful, testable unit.

### Step 1 — Schema
Add all new models to `prisma/schema.prisma` and run migration.
Estimated scope: 1 file, ~200 lines of schema.

### Step 2 — Provider token service
Build `lib/providers/token-service.ts` and `lib/providers/types.ts`.
Testable: unit-test token refresh logic.

### Step 3 — Whoop API client
Build `lib/providers/whoop/api-client.ts` and `lib/providers/whoop/types.ts`.
Testable: can make authenticated requests to Whoop (needs real token later).

### Step 4 — OAuth flow
Build callback route, permission page, middleware update.
Testable: full OAuth round-trip, connection created in DB.
Depends on: Step 1 (schema), Step 2 (token service).

### Step 5 — Adapter layer
Build `lib/providers/whoop/adapter.ts`.
Testable: unit-test transformations with mock data.

### Step 6 — Sync service
Build `lib/providers/whoop/sync-service.ts` and sync API route.
Testable: triggers backfill, data appears in raw + canonical tables.
Depends on: Steps 1-5.

### Step 7 — Webhook handler
Build `app/api/webhooks/whoop/route.ts` with HMAC verification.
Testable: POST mock webhook, verify signature check, data upserted.
Depends on: Steps 1-3, 5-6.

### Step 8 — Biometrics page
Build the biometrics page with sleep, recovery, and cycle cards.
Testable: page renders canonical data.
Depends on: Step 1 (schema).

### Step 9 — Home page summary
Add biometrics summary to home page.
Depends on: Step 1.

### Step 10 — Gym session association
Add Whoop workout data display and manual association UI to gym sessions.
Depends on: Step 1, Step 6.

### Step 11 — Syncing indicator + SideNav
Add sync status context, header indicator, and nav link.
Depends on: Step 6, Step 8.

### Step 12 — Connection management
Add disconnect flow, error banner, reconnect logic.
Depends on: Step 4.

---

## Open Items / Decisions Made

| Decision | Resolution |
|---|---|
| Data granularity | Time-series (stage durations, zone durations) |
| Workout matching | Time overlap, user-confirmed |
| Cycle-to-day mapping | Flatten in canonical layer; wake day = cycle's dateStr |
| Token storage | Supabase DB, extensible ProviderConnection table |
| Webhook endpoint | New `app/api/` route, public in middleware |
| Historical backfill | Full, rate-limit aware, cursor-resumable |
| MVP scope | All categories wired for capture + display, no graphing |
| Body measurement conflicts | Ask user when it becomes an issue |
| UI placement | Summary on home page, detail on /biometrics, workout data on gym sessions |
| Data on revocation | Keep existing, stop syncing |
| Webhook signatures | HMAC-SHA256 verification |
| Disconnection UX | Banner on biometrics page |

---

## Whoop API Reference (quick ref)

| Endpoint | Method | Scope | Pagination | Notes |
|---|---|---|---|---|
| `/v2/cycle` | GET | read:cycles | nextToken, limit≤25 | No webhooks for cycles |
| `/v2/cycle/{id}` | GET | read:cycles | — | |
| `/v2/activity/sleep` | GET | read:sleep | nextToken, limit≤25 | |
| `/v2/activity/sleep/{id}` | GET | read:sleep | — | |
| `/v2/activity/workout` | GET | read:workout | nextToken, limit≤25 | |
| `/v2/activity/workout/{id}` | GET | read:workout | — | |
| `/v2/recovery` | GET | read:recovery | nextToken, limit≤25 | |
| `/v2/cycle/{id}/recovery` | GET | read:recovery | — | |
| `/v2/user/profile/basic` | GET | read:profile | — | |
| `/v2/user/measurement/body` | GET | read:body_measurement | — | Not paginated |
| Token endpoint | POST | — | — | `https://api.prod.whoop.com/oauth/oauth2/token` |
| Auth endpoint | GET | — | — | `https://api.prod.whoop.com/oauth/oauth2/auth` |

Webhook events: `sleep.updated`, `sleep.deleted`, `recovery.updated`, `recovery.deleted`, `workout.updated`, `workout.deleted`
No webhook events for: cycles, body measurements (must poll).

OAuth scopes: `read:recovery`, `read:cycles`, `read:workout`, `read:sleep`, `read:profile`, `read:body_measurement`, `offline` (for refresh tokens).
