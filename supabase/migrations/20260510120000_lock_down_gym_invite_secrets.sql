-- Lock down gym invite secrets so they can never be read by non-staff,
-- and stop leaking them via the broad `gyms` SELECT policy.

-- 1) Replace open SELECT row policy with members + owner.
DROP POLICY IF EXISTS "Authenticated users can view gyms" ON public.gyms;

CREATE POLICY "Members and owner can view gym"
ON public.gyms
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR id IN (
    SELECT gm.gym_id FROM public.gym_memberships gm
    WHERE gm.user_id = auth.uid()
  )
);

-- 2) Column-level: invite_token / temp_invite_code / temp_code_expires
--    are no longer readable through the table for `authenticated`.
REVOKE SELECT ON public.gyms FROM authenticated;
GRANT SELECT
  (id, name, description, address, logo_url, owner_id, created_at, updated_at)
  ON public.gyms TO authenticated;

-- 3) Coach/admin-only RPC for reading invite secrets.
CREATE OR REPLACE FUNCTION public.get_gym_invite_details(p_gym_id uuid)
RETURNS TABLE (
  invite_token uuid,
  temp_invite_code text,
  temp_code_expires timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gym_memberships
    WHERE gym_id = p_gym_id
      AND user_id = auth.uid()
      AND role IN ('coach', 'admin')
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT g.invite_token, g.temp_invite_code, g.temp_code_expires
  FROM public.gyms g
  WHERE g.id = p_gym_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_gym_invite_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gym_invite_details(uuid) TO authenticated;

-- 4) generate_temp_invite_code now returns (code, expires) so the client
--    no longer needs a follow-up SELECT on gyms (which is column-restricted).
DROP FUNCTION IF EXISTS public.generate_temp_invite_code(uuid);

CREATE OR REPLACE FUNCTION public.generate_temp_invite_code(p_gym_id uuid)
RETURNS TABLE (code text, expires timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
  v_code TEXT;
  v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_expires TIMESTAMPTZ;
  i INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gym_memberships
    WHERE gym_id = p_gym_id
      AND user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_code := '';
  FOR i IN 1..8 LOOP
    v_code := v_code
      || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
  END LOOP;

  v_expires := now() + interval '2 hours';

  UPDATE public.gyms
  SET temp_invite_code = v_code,
      temp_code_expires = v_expires
  WHERE id = p_gym_id;

  RETURN QUERY SELECT v_code, v_expires;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_temp_invite_code(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_temp_invite_code(uuid) TO authenticated;
