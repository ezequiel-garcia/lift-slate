# CLAUDE.md

We're building the app described in @SPEC.MD. Read that file for general architectural tasks or to double-check the exact database structure, tech stack or application architecture.

Keep the replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to ensure that you're working with up-to-date information.
User DocsExplorer subagent for efficient documentation lookup.

## Project Overview

Strength training app. Stores athlete lift maxes, auto-calculates percentage-based training weights.

## Stack

- React Native + Expo (managed workflow, Expo Router)
- Supabase (Postgres + Auth + Edge Functions)
- TypeScript (strict), Zustand (client state), TanStack React Query (server state)

## Structure

```
app/(auth)/         → login, signup, onboarding
app/(tabs)/         → index (My Lifts), calculator, history, profile
app/exercise/[id]   → exercise detail + calculator + history
components/ui/      → generic UI components
components/exercises/, calculator/, history/
lib/                → supabase.ts, units.ts, rounding.ts, constants.ts
hooks/              → useAuth, useExercises, useMaxes, useProfile
services/           → auth, exercises, maxes, profile (.service.ts)
stores/             → appStore.ts (Zustand, UI-only state)
types/              → database.types.ts (auto-generated), exercise.ts, max.ts
supabase/migrations/, functions/
```

## Critical Rules

1. **ALL weights stored in kg.** Convert to/from lbs ONLY at display layer via `lib/units.ts`.
2. **RLS enforces permissions.** Client never decides access — database does.
3. **Server state in React Query, client state in Zustand.** Never duplicate.
4. **Supabase queries live in `services/`.** Hooks in `hooks/` wrap them with React Query.
5. TypeScript strict. Functional components only. async/await only.
6. Components: PascalCase. Utils/services: camelCase.

## DB Tables (MVP)

- **users**: id (=auth.uid), email, display_name, unit_preference (kg|lbs), rounding_increment_kg (default 2.5), allow_coach_edit (default true)
- **exercises**: id, name, category (squat|press|pull|olympic|accessory), is_default, created_by
- **maxes**: id, user_id, exercise_id, weight_kg (DECIMAL, always kg), recorded_at, notes, source (manual|workout_log|coach)

## RLS (MVP)

- users: own row only
- exercises: SELECT defaults + own; INSERT/UPDATE/DELETE own only
- maxes: full CRUD own rows only

## Auth

Email+password, Google. Supabase Auth with expo-secure-store adapter.

## Key Packages

expo-router, @supabase/supabase-js, @tanstack/react-query, zustand, expo-secure-store, date-fns, react-native-reanimated

## Env Vars (.env, not committed)

EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
