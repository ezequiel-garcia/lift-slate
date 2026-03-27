-- Rate limiting for join_gym_by_temp_code
-- Tracks failed attempts per user; blocks after 10 attempts in 15 minutes.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE private.join_attempts (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX join_attempts_user_window_idx
  ON private.join_attempts (user_id, attempted_at DESC);

-- Replace join_gym_by_temp_code with rate-limited version
CREATE OR REPLACE FUNCTION public.join_gym_by_temp_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_gym_id        UUID;
  v_expires       TIMESTAMPTZ;
  v_athlete_count INTEGER;
  v_max_athletes  INTEGER;
  v_attempts      INTEGER;
BEGIN
  -- Rate limit: max 10 attempts per 15 minutes per user
  SELECT COUNT(*) INTO v_attempts
  FROM private.join_attempts
  WHERE user_id = auth.uid()
    AND attempted_at > now() - interval '15 minutes';

  IF v_attempts >= 10 THEN
    RAISE EXCEPTION 'Too many attempts. Please wait before trying again.';
  END IF;

  -- Log this attempt upfront (counts whether it succeeds or fails)
  INSERT INTO private.join_attempts (user_id) VALUES (auth.uid());

  -- Find gym by temp code
  SELECT id, temp_code_expires INTO v_gym_id, v_expires
  FROM gyms
  WHERE temp_invite_code = upper(p_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid code';
  END IF;

  -- Check expiry
  IF now() > v_expires THEN
    RAISE EXCEPTION 'Code expired';
  END IF;

  -- Check user not already in a gym
  IF EXISTS (SELECT 1 FROM gym_memberships WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already in a gym';
  END IF;

  -- Check subscription limit
  SELECT gs.max_athletes INTO v_max_athletes
  FROM gym_subscriptions gs WHERE gs.gym_id = v_gym_id;

  SELECT COUNT(*) INTO v_athlete_count
  FROM gym_memberships WHERE gym_id = v_gym_id AND role = 'athlete';

  IF v_athlete_count >= v_max_athletes THEN
    RAISE EXCEPTION 'Gym is full';
  END IF;

  -- Create membership
  INSERT INTO gym_memberships (gym_id, user_id, role)
  VALUES (v_gym_id, auth.uid(), 'athlete');

  -- Clean up attempts on success
  DELETE FROM private.join_attempts WHERE user_id = auth.uid();

  RETURN v_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
