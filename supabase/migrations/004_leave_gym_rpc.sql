-- Atomic leave_gym RPC: checks admin role and deletes in one transaction
CREATE OR REPLACE FUNCTION public.leave_gym(p_membership_id UUID)
RETURNS VOID AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM gym_memberships
  WHERE id = p_membership_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  IF v_role = 'admin' THEN
    RAISE EXCEPTION 'Admins cannot leave a gym. Transfer ownership or delete the gym first.';
  END IF;

  DELETE FROM gym_memberships
  WHERE id = p_membership_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
