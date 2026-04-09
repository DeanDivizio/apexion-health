# Apexion Health

A Next.js 16 (App Router, Turbopack) personal health tracking PWA. Single application, not a monorepo.

## Cursor Cloud specific instructions

### Required services

| Service | How to start |
|---|---|
| PostgreSQL | `sudo pg_ctlcluster 16 main start` (must be running before dev server) |
| Next.js dev server | `npm run dev` (port 3000) |

### Key commands

- **Dev server:** `npm run dev`
- **Lint:** `npx eslint . --ext .ts,.tsx` (Next.js 16 removed the `next lint` subcommand)
- **Build:** `npm run build` (runs `prisma generate && next build`)
- **Prisma generate:** `npx prisma generate`
- **Prisma push schema:** `npx prisma db push`

### Environment variables

A `.env` file must exist at the repo root. The following are **required** for the dev server to start without crashing:

- `DATABASE_URL` — PostgreSQL connection string (`postgresql://apexion:apexion@localhost:5432/apexion_dev` for local dev)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk auth (pages will 500 with placeholders, but server compiles and routes resolve)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` — Legacy DynamoDB module (`actions/AWS.ts`) throws at module load if missing. Dummy values work for non-DynamoDB flows.
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` — PostHog client init expects this
- `RESEND_API_KEY` — Resend constructor throws at module level if missing; required for `npm run build` to collect page data

### Gotchas

- **Clerk middleware blocks all non-public routes.** Without valid Clerk keys, every page except `/sign-in` and `/sign-up` returns 500. The dev server still compiles and hot-reloads correctly.
- **`npm run build` requires valid Clerk keys** for static page generation. TypeScript compilation and route resolution succeed with placeholders, but the SSG step fails.
- **`actions/AWS.ts` eagerly validates** env vars at module load time. Any server action that transitively imports this module will crash if the three AWS vars are missing.
- **No test suite exists** in this repo. There are no unit/integration test files or test framework configured.
- **No `.env.example`** is committed; see the list above for required variables.
