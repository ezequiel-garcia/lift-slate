-- Coach/admin can view maxes of athletes in the same gym
-- when the athlete has allow_coach_edit = true
CREATE POLICY "Coach/admin can view athlete maxes"
  ON maxes FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = maxes.user_id AND u.allow_coach_edit = true
    )
    AND EXISTS (
      SELECT 1
      FROM gym_memberships caller_gm
      JOIN gym_memberships athlete_gm ON athlete_gm.gym_id = caller_gm.gym_id
      WHERE caller_gm.user_id = auth.uid()
        AND caller_gm.role IN ('coach', 'admin')
        AND athlete_gm.user_id = maxes.user_id
    )
  );

-- Coach/admin can insert maxes for athletes in the same gym
CREATE POLICY "Coach/admin can create athlete maxes"
  ON maxes FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = maxes.user_id AND u.allow_coach_edit = true
    )
    AND EXISTS (
      SELECT 1
      FROM gym_memberships caller_gm
      JOIN gym_memberships athlete_gm ON athlete_gm.gym_id = caller_gm.gym_id
      WHERE caller_gm.user_id = auth.uid()
        AND caller_gm.role IN ('coach', 'admin')
        AND athlete_gm.user_id = maxes.user_id
    )
  );

-- Coach/admin can update maxes for athletes in the same gym
CREATE POLICY "Coach/admin can update athlete maxes"
  ON maxes FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = maxes.user_id AND u.allow_coach_edit = true
    )
    AND EXISTS (
      SELECT 1
      FROM gym_memberships caller_gm
      JOIN gym_memberships athlete_gm ON athlete_gm.gym_id = caller_gm.gym_id
      WHERE caller_gm.user_id = auth.uid()
        AND caller_gm.role IN ('coach', 'admin')
        AND athlete_gm.user_id = maxes.user_id
    )
  );
