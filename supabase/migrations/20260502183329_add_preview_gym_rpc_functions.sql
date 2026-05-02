-- Preview a gym by its permanent invite token (deep link)
CREATE OR REPLACE FUNCTION public.preview_gym_by_token(p_token UUID)
RETURNS TABLE(id UUID, name TEXT, description TEXT, member_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    COUNT(gm.id) AS member_count
  FROM gyms g
  LEFT JOIN gym_memberships gm ON gm.gym_id = g.id
  WHERE g.invite_token = p_token
  GROUP BY g.id, g.name, g.description;
END;
$$;

-- Preview a gym by its temporary 8-char invite code
CREATE OR REPLACE FUNCTION public.preview_gym_by_temp_code(p_code TEXT)
RETURNS TABLE(id UUID, name TEXT, description TEXT, member_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    COUNT(gm.id) AS member_count
  FROM gyms g
  LEFT JOIN gym_memberships gm ON gm.gym_id = g.id
  WHERE g.temp_invite_code = UPPER(p_code)
    AND g.temp_code_expires > now()
  GROUP BY g.id, g.name, g.description;
END;
$$;
