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
- **NativeWind v4** (Tailwind CSS for React Native) — use `className` everywhere, no `StyleSheet` unless unavoidable

## Structure

```
app/(auth)/         → login, signup, onboarding
app/(tabs)/         → index (My Lifts), gym, calculator, history, profile
app/exercise/[id]   → exercise detail + calculator + history
app/gym/create.tsx  → create gym form
app/gym/join.tsx    → join gym (code input + deep link)
app/gym/[id]/       → gym home, settings, members, workout screens
components/ui/      → generic UI components
components/exercises/, calculator/, history/, gym/, workout/
lib/                → supabase.ts, units.ts, rounding.ts, constants.ts
hooks/              → useAuth, useExercises, useMaxes, useProfile, useGym, useInvite, useRoles, useWorkouts
services/           → auth, exercises, maxes, profile, gym, invite, roles, workout, storage (.service.ts)
stores/             → appStore.ts (Zustand, UI-only state)
types/              → database.types.ts (auto-generated), exercise.ts, max.ts, gym.ts, workout.ts
supabase/migrations/, functions/
```

## Critical Rules

1. **ALL weights stored in kg.** Convert to/from lbs ONLY at display layer via `lib/units.ts`.
2. **RLS enforces permissions.** Client never decides access — database does.
3. **Server state in React Query, client state in Zustand.** Never duplicate.
4. **Supabase queries live in `services/`.** Hooks in `hooks/` wrap them with React Query.
5. TypeScript strict. Functional components only. async/await only.
6. Components: PascalCase. Utils/services: camelCase.
7. **Prefer Expo components** over raw React Native when better (`Pressable` > `TouchableOpacity`, `expo-image` > `Image`, etc.).
8. **Screens orchestrate, they don't define.** Extract anything with a clear, nameable purpose:
   - Data/logic → custom hook in `hooks/` (e.g. `useMyLifts.ts`)
   - Reusable UI → `components/ui/` (e.g. `SectionHeader`)
   - Feature UI → `components/<feature>/` (e.g. `components/exercises/ExercisesEmptyState.tsx`)
   - Shared types → `types/exercise.ts`, `types/max.ts`, etc.
   - Shared constants → `lib/constants.ts`
   - Keep inline only if it's trivial JSX that only makes sense in that context.

## NativeWind / Tailwind

Custom colors in `tailwind.config.js` (extend these, never use hex in className):
- `bg-bg` / `bg-surface` / `bg-surface2` — backgrounds
- `text-foreground` / `text-muted` / `text-accent` / `text-error` — text colors
- `border-border` — borders
- `bg-accent` — accent fills (lime green `#AAFF45`)

Avoid dynamic class string interpolation (`text-${color}`). Use full conditional classes instead.

## Key Packages

expo-router, @supabase/supabase-js, @tanstack/react-query, zustand, expo-secure-store, date-fns, react-native-reanimated, nativewind, expo-image-picker (Phase 2), expo-linking (Phase 2)

## DB Tables (Phase 1 — MVP)

- **users**: id (=auth.uid), email, display_name, unit_preference (kg|lbs), rounding_increment_kg (default 2.5), allow_coach_edit (default true)
- **exercises**: id, name, category (squat|press|pull|olympic|accessory), is_default, created_by
- **maxes**: id, user_id, exercise_id, weight_kg (DECIMAL, always kg), recorded_at, notes, source (manual|workout_log|coach)

## DB Tables (Phase 2 — Gym & Coach)

- **gyms**: id, name, description?, address?, logo_url?, invite_token (UUID, unique, permanent deep link), temp_invite_code (TEXT?, 8-char alphanumeric), temp_code_expires (TIMESTAMPTZ?), owner_id (FK→users)
- **gym_memberships**: id, gym_id, user_id (UNIQUE — one gym per user), role (athlete|coach|admin), joined_at
- **gym_subscriptions**: id, gym_id (UNIQUE), plan (free|trial|pro), max_athletes (default 10), max_coaches (default 1), trial_started_at?, trial_ends_at?, status (active|trial|trial_expired|cancelled)
- **workouts**: id, gym_id, created_by, title?, scheduled_date (DATE), notes?, published (default false)
- **workout_sections**: id, workout_id (CASCADE), title, order_index
- **workout_items**: id, section_id (CASCADE), order_index, item_type (structured|free_text), exercise_id?, sets?, reps?, percentage?, max_type_reference?, weight_kg?, content?, notes?

### Phase 2 Enums
gym_membership_role, workout_item_type, subscription_plan, subscription_status

### Phase 2 Auto-triggers
- New gym → auto-creates gym_subscription (free plan) + gym_membership (admin role for owner)
- `generate_temp_invite_code(gym_id)` → Postgres RPC, 8-char code, 2hr expiry, replaces previous

### Phase 2 Atomic Operations (Postgres RPC functions)
- `join_gym_by_token(token)` — validates token, checks limits, creates membership
- `join_gym_by_temp_code(code)` — validates code + expiry + limits, creates membership
- `update_member_role(membership_id, new_role)` — validates caller is admin, respects coach limits

## RLS

### Phase 1
- users: own row only
- exercises: SELECT defaults + own; INSERT/UPDATE/DELETE own only
- maxes: full CRUD own rows only

### Phase 2
- gyms: SELECT for any authenticated user; INSERT for authenticated; UPDATE/DELETE by owner only
- gym_memberships: SELECT own + same gym; no direct INSERT (via RPC); UPDATE/DELETE by gym admin
- gym_subscriptions: SELECT by gym admin only
- workouts: SELECT if gym member AND (published OR coach/admin); INSERT/UPDATE/DELETE by coach/admin
- workout_sections/items: inherit access from parent workout's gym

## Auth

Email+password, Google. Supabase Auth with expo-secure-store adapter.

## Env Vars (.env, not committed)

EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
