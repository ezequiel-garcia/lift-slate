-- Eliminate RLS cascade: sections/items use SECURITY DEFINER get_my_gym_id()
-- instead of subqueries that trigger parent table RLS

CREATE OR REPLACE FUNCTION public.get_my_gym_role()
RETURNS gym_membership_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM gym_memberships WHERE user_id = auth.uid() LIMIT 1;
$$;

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
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_id
    AND w.gym_id = public.get_my_gym_id()
  )
);

DROP POLICY IF EXISTS "Items visible if section visible" ON workout_items;
CREATE POLICY "Items visible if section visible"
ON workout_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_sections ws
    JOIN workouts w ON w.id = ws.workout_id
    WHERE ws.id = section_id
    AND w.gym_id = public.get_my_gym_id()
  )
);

-- Add missing index
CREATE INDEX IF NOT EXISTS idx_workout_sections_workout ON public.workout_sections USING btree (workout_id);
