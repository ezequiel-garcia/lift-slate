# LiftSlate — Technical Implementation Spec (Phase 1 MVP)

> **This document is the original bootstrapping spec.** The codebase has evolved since it was written — several schemas, enums, and service names differ from what you see below. For the current authoritative reference, read **`ARCHITECTURE.md`** and **`CLAUDE.md`**. Notable divergences are called out inline.

## Overview

LiftSlate is a mobile application designed for strength training athletes and coaches. It solves a daily friction point in gyms worldwide: when a workout prescribes loads as percentages of a one-rep max (1RM), athletes must manually look up their numbers, calculate the weight, and round to available plates. This process is slow, error-prone, and especially problematic in fast-paced group classes like CrossFit.
LiftSlate stores each athlete’s lift records and automatically calculates training weights based on percentage prescriptions. In its expanded form, it connects athletes to their gym community, allowing coaches to publish workouts where every athlete sees personalized, pre-calculated weights

---

## 1. Project Initialization

### 1.1 Create Expo Project

```bash
npx create-expo-app liftslate --template tabs
cd liftslate
```

### 1.2 Install Dependencies

```bash
# Core
npx expo install expo-router expo-linking expo-constants expo-status-bar

# Supabase
npm install @supabase/supabase-js expo-secure-store

# State management
npm install @tanstack/react-query zustand

# Auth providers
npx expo install expo-crypto expo-auth-session
npm install @react-native-google-signin/google-signin

# UI & UX
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install expo-haptics expo-image-picker

# Date handling
npm install date-fns
```

### 1.3 TypeScript Configuration

Ensure `tsconfig.json` has strict mode:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 2. Supabase Setup

### 2.1 Create Supabase Project

1. Go to supabase.com and create a new project.
2. Save the Project URL and Anon Key.
3. Create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2.2 Supabase Client (`lib/supabase.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Database } from "@/types/database.types";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
```

### 2.3 Database Migration (SQL)

Run this in the Supabase SQL Editor or save as a migration file:

```sql
-- ============================================
-- ENUMS
-- ⚠️  Current schema — differs from original spec
-- ============================================
CREATE TYPE unit_preference AS ENUM ('kg', 'lbs');
CREATE TYPE max_source AS ENUM ('manual', 'coach');          -- 'workout_log' removed
CREATE TYPE equipment_type AS ENUM ('barbell', 'dumbbell', 'kettlebell', 'bodyweight', 'machine', 'other');
CREATE TYPE reference_type AS ENUM ('one_rep_max', 'max_reps', 'working_weight');
CREATE TYPE prescription_mode AS ENUM ('percentage', 'fixed_weight', 'bodyweight', 'heavy', 'easy');
-- exercise_category enum was replaced by equipment_type

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  unit_preference unit_preference NOT NULL DEFAULT 'kg',
  rounding_increment_kg DECIMAL(5,2) NOT NULL DEFAULT 2.5,
  allow_coach_edit BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- EXERCISES TABLE
-- ⚠️  Uses equipment_type, not category
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  equipment_type equipment_type,          -- barbell | dumbbell | kettlebell | bodyweight | machine | other
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- EXERCISE REFERENCES TABLE (replaces "maxes")
-- ⚠️  Table is exercise_references, not maxes
-- ============================================
CREATE TABLE exercise_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  reference_type reference_type NOT NULL DEFAULT 'one_rep_max',
  weight_kg DECIMAL(7,3),                -- NULL for max_reps reference type
  reps INTEGER,                          -- NULL unless reference_type = 'max_reps'
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  source max_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_references_user_exercise ON exercise_references(user_id, exercise_id);

CREATE TRIGGER exercise_references_updated_at
  BEFORE UPDATE ON exercise_references
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (id = auth.uid());

-- Exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view default and own exercises"
  ON exercises FOR SELECT
  USING (is_default = true OR created_by = auth.uid());

CREATE POLICY "Users can create exercises"
  ON exercises FOR INSERT
  WITH CHECK (created_by = auth.uid() AND is_default = false);

CREATE POLICY "Users can update own exercises"
  ON exercises FOR UPDATE
  USING (created_by = auth.uid() AND is_default = false);

CREATE POLICY "Users can delete own exercises"
  ON exercises FOR DELETE
  USING (created_by = auth.uid() AND is_default = false);

-- Exercise References (replaces Maxes)
ALTER TABLE exercise_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own references"
  ON exercise_references FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own references"
  ON exercise_references FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own references"
  ON exercise_references FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own references"
  ON exercise_references FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- SEED DEFAULT EXERCISES
-- ⚠️  Uses equipment_type, not category. Full seed list is in migrations.
-- ============================================
INSERT INTO exercises (name, equipment_type, is_default) VALUES
  ('Back Squat', 'barbell', true),
  ('Front Squat', 'barbell', true),
  ('Deadlift', 'barbell', true),
  ('Bench Press', 'barbell', true),
  ('Clean & Jerk', 'barbell', true),
  ('Snatch', 'barbell', true),
  ('Goblet Squat', 'kettlebell', true),
  ('Pull-ups', 'bodyweight', true);
  -- Full list in supabase/migrations/
```

---

## 3. Core Utility Modules

### 3.1 Unit Conversion (`lib/units.ts`)

```typescript
const LBS_PER_KG = 2.20462;

export type WeightUnit = "kg" | "lbs";

/** Convert a user-entered value to kg for database storage */
export function toKg(value: number, unit: WeightUnit): number {
  if (unit === "kg") return value;
  return value / LBS_PER_KG;
}

/** Convert a kg value from the database to the user's display unit */
export function fromKg(valueKg: number, unit: WeightUnit): number {
  if (unit === "kg") return valueKg;
  return valueKg * LBS_PER_KG;
}

/** Round to the nearest plate increment */
export function roundToPlate(
  value: number,
  incrementKg: number,
  unit: WeightUnit,
): number {
  const increment = unit === "kg" ? incrementKg : fromKg(incrementKg, "lbs");
  return Math.round(value / increment) * increment;
}

/** Calculate percentage of a max, converted and rounded for display */
export function calculatePercentage(
  maxKg: number,
  percentage: number,
  unit: WeightUnit,
  roundingIncrementKg: number,
): { raw: number; rounded: number } {
  const rawKg = maxKg * (percentage / 100);
  const displayRaw = fromKg(rawKg, unit);
  const displayRounded = roundToPlate(displayRaw, roundingIncrementKg, unit);
  return { raw: parseFloat(displayRaw.toFixed(1)), rounded: displayRounded };
}

/** Format a weight for display */
export function formatWeight(value: number, unit: WeightUnit): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${unit}`;
}
```

### 3.2 Constants (`lib/constants.ts`)

> ⚠️ `EXERCISE_CATEGORIES` was replaced by `EQUIPMENT_TYPES` / `EQUIPMENT_ORDER`. `roundToPlate` was removed from `units.ts` — rounding uses `rounding_increment_kg` from the user profile.

```typescript
// Current constants (see lib/constants.ts for full source)
export const COMMON_PERCENTAGES = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
export const INVITE_BASE_URL = "https://liftslate-invite.vercel.app";
export const EQUIPMENT_TYPES = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "machine", label: "Machine" },
  { value: "other", label: "Other" },
];
```

---

## 4. Service Layer (Supabase Queries)

### 4.1 Exercises Service (`services/exercises.service.ts`)

> ⚠️ Orders by `equipment_type` in the live code, not `category`.

```typescript
// Current implementation orders by equipment_type + name
export async function getExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("equipment_type")
    .order("name");
  if (error) throw error;
  return data;
}
```

### 4.2 Exercise References Service (`services/exerciseReferences.service.ts`)

> ⚠️ The live service is `exerciseReferences.service.ts`, not `maxes.service.ts`. It handles `reference_type` (one_rep_max / max_reps / working_weight).

```typescript
// See services/exerciseReferences.service.ts for the full current implementation.
// Key differences from the original maxes service:
// - Table is exercise_references, not maxes
// - Supports reference_type: 'one_rep_max' | 'max_reps' | 'working_weight'
// - weight_kg is nullable (null for max_reps type)
// - reps field added for max_reps type
// - Coach can create references for athletes via createAthleteReference()
```

### 4.3 Profile Service (`services/profile.service.ts`)

```typescript
import { supabase } from "@/lib/supabase";
import { WeightUnit } from "@/lib/units";

export async function getProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(updates: {
  display_name?: string;
  unit_preference?: WeightUnit;
  rounding_increment_kg?: number;
  allow_coach_edit?: boolean;
  avatar_url?: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

---

## 5. React Query Hooks

### 5.1 useExercises (`hooks/useExercises.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as exercisesService from "@/services/exercises.service";

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: exercisesService.getExercises,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, category }: { name: string; category?: string }) =>
      exercisesService.createExercise(name, category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });
}
```

### 5.2 useExerciseReferences (`hooks/useExerciseReferences.ts`)

> ⚠️ Hook is `useExerciseReferences`, not `useMaxes`. Query key is `["exercise_references"]`.
> See `hooks/useExerciseReferences.ts` for the full implementation including coach/athlete mutations.

---

## 6. Auth Configuration

### 6.1 Supabase Auth Setup

In the Supabase Dashboard:

1. **Email/Password:** Enabled. Email confirmation disabled for smoother onboarding.
2. **Google OAuth:** OAuth credentials in Google Cloud Console. Redirect URI added to Supabase.
3. **Apple Sign In:** App registered with Apple, `expo-apple-authentication` handles the native dialog, identity token exchanged via `supabase.auth.signInWithIdToken`. Required for App Store (Apple mandates it when any OAuth is offered).

PKCE flow (`flowType: "pkce"`) is set in `lib/supabase.ts` — required for mobile OAuth.

### 6.2 Expo Config (`app.json`)

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.liftslate.app"
    },
    "android": {
      "package": "com.liftslate.app"
    },
    "scheme": "liftslate"
  }
}
```

---

## 7. Screen Specifications

### 7.1 Home Screen (My Lifts) — `app/(tabs)/index.tsx`

- Search bar (filters by name)
- Exercise list grouped by **equipment type** (barbell, dumbbell, kettlebell, bodyweight, machine, other): name, current reference in user unit, trend indicator (↑↓→)
- `one_rep_max` references show weight; `max_reps` references show rep count
- FAB: "+ Add Exercise"
- Tapping exercise → `exercise/[id]`
- Empty state: illustration + "Add your first exercise" + button

### 7.2 Exercise Detail — `app/exercise/[id].tsx`

**Tab 1: Calculator**

- Current 1RM display
- Percentage grid (tappable 50-95%), custom input
- Result: "80% = 96 kg → 95 kg" (raw → rounded)

**Tab 2: History**

- Chronological max list: date, weight, notes, source
- PR badge on all-time best
- Delta indicator: "+5 kg since previous"
- "Add New Max" button

### 7.3 Quick Calculator — `app/(tabs)/calculator.tsx`

- Exercise dropdown, percentage input, calculate → result

### 7.4 History — `app/(tabs)/history.tsx`

- Combined timeline across all exercises
- Filters: exercise, date range
- PR highlights section

### 7.5 Profile — `app/(tabs)/profile.tsx`

- Display name, unit toggle (kg/lbs), rounding increment, coach permission toggle, sign out

### 7.6 Onboarding — `app/(auth)/onboarding.tsx`

- Step 1: Name
- Step 2: Units (kg/lbs)
- Step 3: Add first lift (optional, skip allowed)

---

## 8. Testing Strategy

### 8.1 Unit Tests (Critical — Jest)

**`lib/units.ts`:**

- toKg: 100 lbs → 45.359 kg; 100 kg → 100 kg
- fromKg: 100 kg → 220.462 lbs; 100 kg → 100 kg
- roundToPlate: 96 kg w/ 2.5 → 95 kg; 97.5 → 97.5
- calculatePercentage: 80% of 100 kg = 80 kg
- Round-trip: lbs → kg → lbs ≈ original

**Edge cases:** very small weights, zero values, large numbers

### 8.2 Integration Tests

- Signup → user row created
- Create max in lbs → stored in kg → displays correctly in lbs
- RLS: user A cannot read user B maxes

---

## 9. EAS Build & Deployment

```bash
npm install -g eas-cli
eas login
eas build:configure

# Dev build
eas build --platform all --profile development

# Production
eas build --platform all --profile production

# Submit
eas submit --platform ios
eas submit --platform android
```

---

## Phase 2: Gym & Coach Features

### Core Concepts

- Any user can create a gym → becomes its admin. Monetization is on the gym entity (free ≤10 athletes).
- A user can belong to only ONE gym at a time.
- Gym tab is always visible. Shows join/create if no gym, today's workout if in a gym.
- Admin assigns coach role to existing gym members. No self-promotion.
- Workouts are tied to specific dates. No recurring schedules yet.
- No workout completion/logging in Phase 2 (deferred to Phase 3).
- No images/videos in workouts. Logo only for gym profile (Supabase Storage).

### Workout Data Model

Workout → Sections → Items. Coach names sections freely.

```
Workout (date: March 15, gym: CrossFit Central)
  └─ Section: "Warm Up" (order: 1)
  │    ├─ Item (free_text): "10 min easy row + mobility"
  │    └─ Item (structured): Back Squat 3x5 @ 50%
  └─ Section: "Strength" (order: 2)
  │    ├─ Item (structured): Back Squat 5x3 @ 80%
  │    └─ Item (structured): Bench Press 4x5 @ 70%
  └─ Section: "MetCon" (order: 3)
  │    └─ Item (free_text): "15 min AMRAP: 10 wall balls, 15 cal row"
  └─ Section: "Cool Down" (order: 4)
       └─ Item (free_text): "5 min easy row + stretching"
```

### Phase 2 DB Tables

#### gyms

- id (UUID, PK)
- name (TEXT, required)
- description (TEXT, nullable)
- address (TEXT, nullable)
- logo_url (TEXT, nullable — Supabase Storage)
- invite_token (UUID, unique — permanent deep link token, auto-generated)
- temp_invite_code (TEXT, nullable — 8-char alphanumeric, for in-person sharing)
- temp_code_expires (TIMESTAMPTZ, nullable — code valid until this time)
- owner_id (UUID, FK → users)
- created_at, updated_at

**Invite system:**

- Deep link (permanent): `liftslate://join/{invite_token}` — always valid, admin can regenerate (invalidates old one)
- Temp code (2hr): admin taps "Generate Code" → 8-char code shown with countdown → expires automatically. New code kills previous one.

#### gym_memberships

- id (UUID, PK)
- gym_id (UUID, FK → gyms)
- user_id (UUID, FK → users, unique — one gym only)
- role (ENUM: 'athlete' | 'coach' | 'admin')
- joined_at (TIMESTAMPTZ)

#### gym_subscriptions

- id (UUID, PK)
- gym_id (UUID, FK → gyms, unique)
- plan (ENUM: 'free' | 'trial' | 'pro')
- max_athletes (INTEGER, default 10)
- max_coaches (INTEGER, default 1)
- trial_started_at, trial_ends_at (TIMESTAMPTZ, nullable)
- status (ENUM: 'active' | 'trial' | 'trial_expired' | 'cancelled')

#### workouts

- id (UUID, PK)
- gym_id (UUID, FK → gyms)
- created_by (UUID, FK → users — must be coach/admin)
- title (TEXT, nullable)
- scheduled_date (DATE)
- notes (TEXT, nullable — general workout notes)
- published (BOOLEAN, default false)
- created_at, updated_at

#### workout_sections

- id (UUID, PK)
- workout_id (UUID, FK → workouts, ON DELETE CASCADE)
- title (TEXT — e.g., "Warm Up", "Strength", "MetCon")
- order_index (INTEGER)

#### workout_items

- id (UUID, PK)
- section_id (UUID, FK → workout_sections, ON DELETE CASCADE)
- order_index (INTEGER)
- item_type (ENUM: 'structured' | 'free_text')
- **If structured:**
  - exercise_id (UUID, FK → exercises, nullable)
  - sets (INTEGER, nullable)
  - reps (INTEGER, nullable)
  - percentage (DECIMAL, nullable — 0.80 = 80%)
  - max_type_reference (ENUM, nullable — default '1rm')
  - weight_kg (DECIMAL, nullable — fixed weight instead of percentage)
- **If free_text:**
  - content (TEXT, nullable)
- notes (TEXT, nullable — item-specific coach notes)

### Phase 2 RLS Policies

- gyms: anyone can SELECT (for join flow); only owner can UPDATE/DELETE
- gym_memberships: SELECT own membership + memberships in same gym; INSERT via Edge Function only
- gym_subscriptions: SELECT/UPDATE by gym admin only; managed mostly via Edge Functions
- workouts: SELECT if member of gym AND published=true (or coach/admin sees unpublished); INSERT/UPDATE/DELETE by coach/admin of that gym
- workout_sections & workout_items: inherit access from parent workout's gym membership

### Phase 2 Edge Functions / Postgres Functions

- **join_gym_by_token(token UUID)**: validates token, checks subscription limits, creates membership. Atomic.
- **join_gym_by_temp_code(code TEXT)**: validates code + checks expiry + subscription limits, creates membership. Atomic.
- **generate_temp_invite_code(gym_id UUID)**: creates 8-char alphanumeric code, sets 2hr expiry, replaces previous code.
- **manage-role**: admin promotes/demotes members (athlete↔coach). Validates admin role + coach limits.
- **publish-workout**: sets published=true, triggers push notification to gym members.

### Phase 2 Navigation

```
app/(tabs)/gym.tsx              → Gym tab (join/create OR today's workout)
app/gym/create.tsx              → Create gym form
app/gym/join.tsx                → Join gym (code input)
app/gym/[id]/index.tsx          → Gym home (today's workout + info)
app/gym/[id]/settings.tsx       → Gym settings (admin only)
app/gym/[id]/members.tsx        → Member list + role management (admin)
app/gym/[id]/workout/new.tsx    → Create workout (coach/admin)
app/gym/[id]/workout/[wid].tsx  → Workout detail view
```

### Phase 2 Key Packages (additions)

- expo-image-picker (gym logo upload)
- expo-notifications (push for WOD published)
- expo-linking (deep link handling for invite links)

# App Store Checklist

### iOS

- [ ] Apple Developer ($99/yr)
- [ ] Bundle ID: `com.liftslate.app`
- [ ] App Store Connect listing
- [ ] Privacy policy URL
- [ ] Review guidelines check

### Android

- [ ] Play Developer ($25)
- [ ] Package: `com.liftslate.app`
- [ ] Play Console listing
- [ ] Privacy policy URL
- [ ] Content rating + data safety
