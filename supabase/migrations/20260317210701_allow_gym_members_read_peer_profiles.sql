CREATE POLICY "gym_members_can_read_peer_profiles"
ON users
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM gym_memberships gm1
    JOIN gym_memberships gm2 ON gm1.gym_id = gm2.gym_id
    WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = users.id
  )
);
