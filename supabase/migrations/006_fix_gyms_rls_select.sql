-- S-02: Restrict gyms SELECT policy to members only.
-- The previous policy allowed any authenticated user to read all gym rows,
-- including invite_token and temp_invite_code, which defeated the invite system.

-- Drop the permissive policy
DROP POLICY IF EXISTS "Authenticated users can view gyms" ON gyms;

-- Members can only see their own gym
CREATE POLICY "Members can view their own gym"
  ON gyms FOR SELECT USING (
    id IN (
      SELECT gym_id FROM gym_memberships WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Preview RPCs for the join flow (used before membership exists)
-- These are SECURITY DEFINER so they bypass RLS, but only return
-- safe, non-sensitive columns (no invite_token / temp_invite_code).
-- ============================================================

CREATE OR REPLACE FUNCTION public.preview_gym_by_token(p_token UUID)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  description TEXT,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      g.id,
      g.name,
      g.description,
      (SELECT COUNT(*) FROM gym_memberships m WHERE m.gym_id = g.id)::BIGINT
    FROM gyms g
    WHERE g.invite_token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.preview_gym_by_temp_code(p_code TEXT)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  description TEXT,
  member_count BIGINT
) AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  -- Rate limit: max 10 lookups per 15 minutes per user
  SELECT COUNT(*) INTO v_attempts
  FROM private.join_attempts
  WHERE user_id = auth.uid()
    AND attempted_at > now() - interval '15 minutes';

  IF v_attempts >= 10 THEN
    RAISE EXCEPTION 'Too many attempts. Please wait before trying again.';
  END IF;

  INSERT INTO private.join_attempts (user_id) VALUES (auth.uid());

  RETURN QUERY
    SELECT
      g.id,
      g.name,
      g.description,
      (SELECT COUNT(*) FROM gym_memberships m WHERE m.gym_id = g.id)::BIGINT
    FROM gyms g
    WHERE g.temp_invite_code = upper(p_code)
      AND g.temp_code_expires > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
