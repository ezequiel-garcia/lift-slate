-- Fix: Use cryptographically secure random for temp invite codes
CREATE OR REPLACE FUNCTION public.generate_temp_invite_code(p_gym_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  -- Verify caller is admin of the gym
  IF NOT EXISTS (
    SELECT 1 FROM gym_memberships
    WHERE gym_id = p_gym_id
      AND user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Generate 8-char code using cryptographically secure random bytes
  v_code := '';
  FOR i IN 1..8 LOOP
    v_code := v_code || substr(v_chars, (get_byte(gen_random_bytes(1), 0) % length(v_chars)) + 1, 1);
  END LOOP;

  -- Update gym with new code (replaces any existing)
  UPDATE gyms
  SET temp_invite_code = v_code,
      temp_code_expires = now() + interval '2 hours'
  WHERE id = p_gym_id;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
