-- S-03: Fix gym_memberships DELETE policy.
-- The previous policy had two branches:
--   1. user_id = auth.uid()  → allowed any member to self-delete, bypassing
--      the leave_gym RPC which blocks admin self-removal.
--   2. gym_id IN (admins)    → also matched the admin's own row, so admins
--      could delete themselves via this branch too.
--
-- Fix: admins can only delete OTHER members' rows. All self-removal must go
-- through the leave_gym SECURITY DEFINER RPC which enforces the admin guard.

DROP POLICY IF EXISTS "Gym admin can delete memberships" ON gym_memberships;

CREATE POLICY "Gym admin can delete memberships"
  ON gym_memberships FOR DELETE USING (
    user_id != auth.uid()
    AND gym_id IN (
      SELECT gym_id FROM gym_memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
