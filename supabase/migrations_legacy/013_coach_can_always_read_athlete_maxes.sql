-- Allow coaches/admins to always read athlete maxes in the same gym,
-- regardless of allow_coach_edit. Writing (insert/update) still requires allow_coach_edit = true.

DROP POLICY IF EXISTS "Coach/admin can view athlete maxes" ON maxes;

CREATE POLICY "Coach/admin can view athlete maxes"
  ON maxes FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM gym_memberships caller_gm
      JOIN gym_memberships athlete_gm ON athlete_gm.gym_id = caller_gm.gym_id
      WHERE caller_gm.user_id = auth.uid()
        AND caller_gm.role IN ('coach', 'admin')
        AND athlete_gm.user_id = maxes.user_id
    )
  );
