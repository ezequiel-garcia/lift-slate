-- Replace slow correlated/nested RLS subqueries with SECURITY DEFINER function lookups

CREATE OR REPLACE FUNCTION public.get_my_gym_role()
RETURNS gym_membership_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM gym_memberships WHERE user_id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS "Members can view published workouts; coach/admin see all" ON workouts;
DROP POLICY IF EXISTS "Members can view gym workouts" ON workouts;
CREATE POLICY "Members can view gym workouts"
ON workouts FOR SELECT
USING (
  gym_id = public.get_my_gym_id()
  AND (published = true OR public.get_my_gym_role() IN ('coach', 'admin'))
);

DROP POLICY IF EXISTS "Sections visible if workout visible" ON workout_sections;
CREATE POLICY "Sections visible if workout visible"
ON workout_sections FOR SELECT
USING (workout_id IN (SELECT id FROM workouts));

DROP POLICY IF EXISTS "Items visible if section visible" ON workout_items;
CREATE POLICY "Items visible if section visible"
ON workout_items FOR SELECT
USING (section_id IN (SELECT id FROM workout_sections));
