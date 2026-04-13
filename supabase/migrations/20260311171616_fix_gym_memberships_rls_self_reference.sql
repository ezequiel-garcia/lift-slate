-- Fix self-referencing RLS policy on gym_memberships that caused infinite recursion
DROP POLICY IF EXISTS "Members can view own membership and same-gym members" ON gym_memberships;
DROP POLICY IF EXISTS "Users can view own membership" ON gym_memberships;
DROP POLICY IF EXISTS "Members can view same-gym members" ON gym_memberships;

-- Helper function to avoid self-referencing RLS
CREATE OR REPLACE FUNCTION public.get_my_gym_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gym_id FROM gym_memberships WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Users can see their own membership
CREATE POLICY "Users can view own membership"
ON gym_memberships FOR SELECT
USING (user_id = auth.uid());

-- Users can see other members in their gym (via security definer function)
CREATE POLICY "Members can view same-gym members"
ON gym_memberships FOR SELECT
USING (gym_id = public.get_my_gym_id());
