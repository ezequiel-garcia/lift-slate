-- RPC: leave_gym — lets a member remove themselves from a gym.
-- Blocks if the user is the gym owner (owner must delete the gym instead).
CREATE OR REPLACE FUNCTION public.leave_gym(p_membership_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
  v_gym_id uuid;
  v_owner_id uuid;
BEGIN
  SELECT gm.gym_id INTO v_gym_id
  FROM public.gym_memberships gm
  WHERE gm.id = p_membership_id AND gm.user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found' USING ERRCODE = '42501';
  END IF;

  SELECT g.owner_id INTO v_owner_id
  FROM public.gyms g WHERE g.id = v_gym_id;

  IF v_owner_id = auth.uid() THEN
    RAISE EXCEPTION 'Gym owner cannot leave — delete the gym instead';
  END IF;

  DELETE FROM public.gym_memberships WHERE id = p_membership_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.leave_gym(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_gym(uuid) TO authenticated;

-- RPC: regenerate_invite_token — replaces the permanent deep-link token.
-- Admin only. Returns the new token UUID.
CREATE OR REPLACE FUNCTION public.regenerate_invite_token(p_gym_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
  v_new_token uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gym_memberships
    WHERE gym_id = p_gym_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  v_new_token := gen_random_uuid();

  UPDATE public.gyms
  SET invite_token = v_new_token
  WHERE id = p_gym_id;

  RETURN v_new_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.regenerate_invite_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_invite_token(uuid) TO authenticated;
