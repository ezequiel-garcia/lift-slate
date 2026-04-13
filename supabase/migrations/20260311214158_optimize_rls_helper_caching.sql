-- Cache get_my_gym_id() and get_my_gym_role() within a transaction
-- so RLS policies don't re-query gym_memberships for every row.

CREATE OR REPLACE FUNCTION get_my_gym_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_cached text;
  v_gym_id uuid;
BEGIN
  -- Check transaction-local cache first
  v_cached := current_setting('app.my_gym_id', true);
  IF v_cached IS NOT NULL AND v_cached <> '' THEN
    RETURN v_cached::uuid;
  END IF;

  SELECT gym_id INTO v_gym_id
  FROM gym_memberships
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Store in transaction-local setting for subsequent calls
  PERFORM set_config('app.my_gym_id', COALESCE(v_gym_id::text, ''), true);

  RETURN v_gym_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_gym_role()
RETURNS gym_membership_role
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_cached text;
  v_role gym_membership_role;
BEGIN
  v_cached := current_setting('app.my_gym_role', true);
  IF v_cached IS NOT NULL AND v_cached <> '' THEN
    RETURN v_cached::gym_membership_role;
  END IF;

  SELECT role INTO v_role
  FROM gym_memberships
  WHERE user_id = auth.uid()
  LIMIT 1;

  PERFORM set_config('app.my_gym_role', COALESCE(v_role::text, ''), true);

  RETURN v_role;
END;
$$;
