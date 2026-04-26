-- Remove subscription limit checks from join/role RPCs
-- The gym_subscriptions table is kept for future use, but limits are no longer enforced

CREATE OR REPLACE FUNCTION public.join_gym_by_token(p_token UUID)
RETURNS UUID AS $$
DECLARE
  v_gym_id UUID;
BEGIN
  SELECT id INTO v_gym_id FROM gyms WHERE invite_token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite link';
  END IF;

  IF EXISTS (SELECT 1 FROM gym_memberships WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already in a gym';
  END IF;

  INSERT INTO gym_memberships (gym_id, user_id, role)
  VALUES (v_gym_id, auth.uid(), 'athlete');

  RETURN v_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.join_gym_by_temp_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_gym_id UUID;
  v_expires TIMESTAMPTZ;
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

  INSERT INTO gym_memberships (gym_id, user_id, role)
  VALUES (v_gym_id, auth.uid(), 'athlete');

  RETURN v_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_member_role(p_membership_id UUID, p_new_role gym_membership_role)
RETURNS VOID AS $$
DECLARE
  v_gym_id UUID;
  v_target_user_id UUID;
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

  UPDATE gym_memberships SET role = p_new_role WHERE id = p_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
