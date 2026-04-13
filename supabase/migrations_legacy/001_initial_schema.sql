-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE unit_preference AS ENUM ('kg', 'lbs');
CREATE TYPE max_source AS ENUM ('manual', 'workout_log', 'coach');
CREATE TYPE exercise_category AS ENUM ('squat', 'press', 'pull', 'olympic', 'accessory');

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

-- ============================================
-- UPDATED_AT HELPER
-- ============================================
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
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category exercise_category,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MAXES TABLE
-- ============================================
CREATE TABLE maxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight_kg DECIMAL(7,3) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  source max_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maxes_user_exercise ON maxes(user_id, exercise_id);

CREATE TRIGGER maxes_updated_at
  BEFORE UPDATE ON maxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (id = auth.uid());

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

ALTER TABLE maxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own maxes"
  ON maxes FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own maxes"
  ON maxes FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own maxes"
  ON maxes FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own maxes"
  ON maxes FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- SEED DEFAULT EXERCISES
-- ============================================
INSERT INTO exercises (name, category, is_default) VALUES
  ('Back Squat', 'squat', true),
  ('Front Squat', 'squat', true),
  ('Overhead Squat', 'squat', true),
  ('Goblet Squat', 'squat', true),
  ('Bench Press', 'press', true),
  ('Overhead Press', 'press', true),
  ('Push Press', 'press', true),
  ('Incline Bench Press', 'press', true),
  ('Deadlift', 'pull', true),
  ('Sumo Deadlift', 'pull', true),
  ('Romanian Deadlift', 'pull', true),
  ('Barbell Row', 'pull', true),
  ('Clean', 'olympic', true),
  ('Clean & Jerk', 'olympic', true),
  ('Snatch', 'olympic', true),
  ('Power Clean', 'olympic', true),
  ('Power Snatch', 'olympic', true),
  ('Hang Clean', 'olympic', true),
  ('Hip Thrust', 'accessory', true),
  ('Lunges', 'accessory', true),
  ('Good Morning', 'accessory', true),
  ('Pendlay Row', 'accessory', true),
  ('Thruster', 'accessory', true);
