-- ============================================
-- PHASE 2: GYM & COACH MIGRATION
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE gym_membership_role AS ENUM ('athlete', 'coach', 'admin');
CREATE TYPE workout_item_type AS ENUM ('structured', 'free_text');
CREATE TYPE subscription_plan AS ENUM ('free', 'trial', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'trial_expired', 'cancelled');

-- ============================================
-- GYMS TABLE
-- ============================================
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  logo_url TEXT,
  invite_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  temp_invite_code TEXT,
  temp_code_expires TIMESTAMPTZ,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- GYM_MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE gym_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role gym_membership_role NOT NULL DEFAULT 'athlete',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gym_memberships_gym_user ON gym_memberships(gym_id, user_id);

-- ============================================
-- GYM_SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE gym_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL UNIQUE REFERENCES gyms(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  max_athletes INTEGER NOT NULL DEFAULT 10,
  max_coaches INTEGER NOT NULL DEFAULT 1,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  status subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- WORKOUTS TABLE
-- ============================================
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT,
  scheduled_date DATE NOT NULL,
  notes TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workouts_gym_date ON workouts(gym_id, scheduled_date);

CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- WORKOUT_SECTIONS TABLE
-- ============================================
CREATE TABLE workout_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- ============================================
-- WORKOUT_ITEMS TABLE
-- ============================================
CREATE TABLE workout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES workout_sections(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  item_type workout_item_type NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  sets INTEGER,
  reps INTEGER,
  percentage DECIMAL(5,2),
  max_type_reference TEXT DEFAULT '1rm',
  weight_kg DECIMAL(7,3),
  content TEXT,
  notes TEXT
);

CREATE INDEX idx_workout_items_section ON workout_items(section_id);

-- ============================================
-- AUTO-TRIGGERS ON GYM INSERT
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_gym()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.gym_subscriptions (gym_id, plan, max_athletes, max_coaches, status)
  VALUES (NEW.id, 'free', 10, 1, 'active');

  INSERT INTO public.gym_memberships (gym_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_gym_created
  AFTER INSERT ON gyms
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_gym();

-- ============================================
-- POSTGRES FUNCTION: generate_temp_invite_code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_temp_invite_code(p_gym_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM gym_memberships
    WHERE gym_id = p_gym_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_code := '';
  FOR i IN 1..8 LOOP
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
  END LOOP;

  UPDATE gyms
  SET temp_invite_code = v_code,
      temp_code_expires = now() + interval '2 hours'
  WHERE id = p_gym_id;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POSTGRES FUNCTION: join_gym_by_token
-- ============================================
CREATE OR REPLACE FUNCTION public.join_gym_by_token(p_token UUID)
RETURNS UUID AS $$
DECLARE
  v_gym_id UUID;
  v_athlete_count INTEGER;
  v_max_athletes INTEGER;
BEGIN
  SELECT id INTO v_gym_id FROM gyms WHERE invite_token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite link';
  END IF;

  IF EXISTS (SELECT 1 FROM gym_memberships WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already in a gym';
  END IF;

  SELECT gs.max_athletes INTO v_max_athletes
  FROM gym_subscriptions gs WHERE gs.gym_id = v_gym_id;

  SELECT COUNT(*) INTO v_athlete_count
  FROM gym_memberships WHERE gym_id = v_gym_id AND role = 'athlete';

  IF v_athlete_count >= v_max_athletes THEN
    RAISE EXCEPTION 'Gym is full';
  END IF;

  INSERT INTO gym_memberships (gym_id, user_id, role)
  VALUES (v_gym_id, auth.uid(), 'athlete');

  RETURN v_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POSTGRES FUNCTION: join_gym_by_temp_code
-- ============================================
CREATE OR REPLACE FUNCTION public.join_gym_by_temp_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_gym_id UUID;
  v_expires TIMESTAMPTZ;
  v_athlete_count INTEGER;
  v_max_athletes INTEGER;
BEGIN
  SELECT id, temp_code_expires INTO v_gym_id, v_expires
  FROM gyms WHERE temp_invite_code = upper(p_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid code';
  END IF;

  IF now() > v_expires THEN
    RAISE EXCEPTION 'Code expired';
  END IF;

  IF EXISTS (SELECT 1 FROM gym_memberships WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already in a gym';
  END IF;

  SELECT gs.max_athletes INTO v_max_athletes
  FROM gym_subscriptions gs WHERE gs.gym_id = v_gym_id;

  SELECT COUNT(*) INTO v_athlete_count
  FROM gym_memberships WHERE gym_id = v_gym_id AND role = 'athlete';

  IF v_athlete_count >= v_max_athletes THEN
    RAISE EXCEPTION 'Gym is full';
  END IF;

  INSERT INTO gym_memberships (gym_id, user_id, role)
  VALUES (v_gym_id, auth.uid(), 'athlete');

  RETURN v_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POSTGRES FUNCTION: update_member_role
-- ============================================
CREATE OR REPLACE FUNCTION public.update_member_role(p_membership_id UUID, p_new_role gym_membership_role)
RETURNS VOID AS $$
DECLARE
  v_gym_id UUID;
  v_target_user_id UUID;
  v_coach_count INTEGER;
  v_max_coaches INTEGER;
BEGIN
  SELECT gym_id, user_id INTO v_gym_id, v_target_user_id
  FROM gym_memberships WHERE id = p_membership_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM gym_memberships
    WHERE gym_id = v_gym_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  IF p_new_role = 'coach' THEN
    SELECT gs.max_coaches INTO v_max_coaches
    FROM gym_subscriptions gs WHERE gs.gym_id = v_gym_id;

    SELECT COUNT(*) INTO v_coach_count
    FROM gym_memberships WHERE gym_id = v_gym_id AND role = 'coach';

    IF v_coach_count >= v_max_coaches THEN
      RAISE EXCEPTION 'Coach limit reached';
    END IF;
  END IF;

  UPDATE gym_memberships SET role = p_new_role WHERE id = p_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================

-- gyms
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view gyms"
  ON gyms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create gyms"
  ON gyms FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Gym owner can update"
  ON gyms FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Gym owner can delete"
  ON gyms FOR DELETE USING (owner_id = auth.uid());

-- gym_memberships
ALTER TABLE gym_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own membership and same-gym members"
  ON gym_memberships FOR SELECT USING (
    user_id = auth.uid()
    OR gym_id IN (
      SELECT gym_id FROM gym_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Gym admin can update memberships"
  ON gym_memberships FOR UPDATE USING (
    gym_id IN (
      SELECT gym_id FROM gym_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Gym admin can delete memberships"
  ON gym_memberships FOR DELETE USING (
    user_id = auth.uid()
    OR gym_id IN (
      SELECT gym_id FROM gym_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- gym_subscriptions
ALTER TABLE gym_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym admin can view subscription"
  ON gym_subscriptions FOR SELECT USING (
    gym_id IN (
      SELECT gym_id FROM gym_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- workouts
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view published workouts; coach/admin see all"
  ON workouts FOR SELECT USING (
    gym_id IN (
      SELECT gm.gym_id FROM gym_memberships gm
      WHERE gm.user_id = auth.uid()
        AND (
          published = true
          OR gm.role IN ('coach', 'admin')
        )
    )
  );

CREATE POLICY "Coach/admin can insert workouts"
  ON workouts FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND gym_id IN (
      SELECT gym_id FROM gym_memberships
      WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coach/admin can update workouts"
  ON workouts FOR UPDATE USING (
    gym_id IN (
      SELECT gym_id FROM gym_memberships
      WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coach/admin can delete workouts"
  ON workouts FOR DELETE USING (
    gym_id IN (
      SELECT gym_id FROM gym_memberships
      WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
  );

-- workout_sections
ALTER TABLE workout_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sections visible if workout visible"
  ON workout_sections FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts)
  );

CREATE POLICY "Coach/admin can insert sections"
  ON workout_sections FOR INSERT WITH CHECK (
    workout_id IN (
      SELECT w.id FROM workouts w
      JOIN gym_memberships gm ON gm.gym_id = w.gym_id
      WHERE gm.user_id = auth.uid() AND gm.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coach/admin can update sections"
  ON workout_sections FOR UPDATE USING (
    workout_id IN (
      SELECT w.id FROM workouts w
      JOIN gym_memberships gm ON gm.gym_id = w.gym_id
      WHERE gm.user_id = auth.uid() AND gm.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coach/admin can delete sections"
  ON workout_sections FOR DELETE USING (
    workout_id IN (
      SELECT w.id FROM workouts w
      JOIN gym_memberships gm ON gm.gym_id = w.gym_id
      WHERE gm.user_id = auth.uid() AND gm.role IN ('coach', 'admin')
    )
  );

-- workout_items
ALTER TABLE workout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items visible if section visible"
  ON workout_items FOR SELECT USING (
    section_id IN (SELECT id FROM workout_sections)
  );

CREATE POLICY "Coach/admin can insert items"
  ON workout_items FOR INSERT WITH CHECK (
    section_id IN (
      SELECT ws.id FROM workout_sections ws
      JOIN workouts w ON w.id = ws.workout_id
      JOIN gym_memberships gm ON gm.gym_id = w.gym_id
      WHERE gm.user_id = auth.uid() AND gm.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coach/admin can update items"
  ON workout_items FOR UPDATE USING (
    section_id IN (
      SELECT ws.id FROM workout_sections ws
      JOIN workouts w ON w.id = ws.workout_id
      JOIN gym_memberships gm ON gm.gym_id = w.gym_id
      WHERE gm.user_id = auth.uid() AND gm.role IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coach/admin can delete items"
  ON workout_items FOR DELETE USING (
    section_id IN (
      SELECT ws.id FROM workout_sections ws
      JOIN workouts w ON w.id = ws.workout_id
      JOIN gym_memberships gm ON gm.gym_id = w.gym_id
      WHERE gm.user_id = auth.uid() AND gm.role IN ('coach', 'admin')
    )
  );
