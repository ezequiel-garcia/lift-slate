-- S-01: Move invite token regeneration server-side.
-- Previously the client generated the UUID and wrote it directly via UPDATE.
-- Now the DB generates and writes it atomically, with an explicit admin check.

CREATE OR REPLACE FUNCTION public.regenerate_invite_token(p_gym_id UUID)
RETURNS UUID AS $$
DECLARE
  v_new_token UUID;
BEGIN
  -- Verify caller is admin of this gym
  IF NOT EXISTS (
    SELECT 1 FROM gym_memberships
    WHERE gym_id = p_gym_id
      AND user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_new_token := gen_random_uuid();

  UPDATE gyms
  SET invite_token = v_new_token
  WHERE id = p_gym_id;

  RETURN v_new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
