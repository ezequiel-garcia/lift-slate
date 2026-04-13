CREATE OR REPLACE FUNCTION get_my_gym_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
