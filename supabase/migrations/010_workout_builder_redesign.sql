-- ============================================
-- MIGRATION 010: WORKOUT BUILDER REDESIGN
-- ============================================
-- Redesigns workout model to "Blocks + Exercises" pattern.
-- Clean slate: deletes all existing workout data.
-- Adds block metadata to sections, swaps item_type enum,
-- and creates an atomic RPC for upserting sections+items.

-- ============================================
-- 1. CLEAN SLATE
-- ============================================
DELETE FROM workout_items;
DELETE FROM workout_sections;
DELETE FROM workouts;

-- ============================================
-- 2. ADD BLOCK METADATA TO SECTIONS
-- ============================================
ALTER TABLE workout_sections
  ADD COLUMN block_type TEXT,
  ADD COLUMN repeat_scheme TEXT;

-- ============================================
-- 3. SWAP workout_item_type ENUM
-- ============================================
-- Can't rename enum values in Postgres, so:
-- column → TEXT → drop old enum → create new → column back

ALTER TABLE workout_items
  ALTER COLUMN item_type TYPE TEXT;

DROP TYPE workout_item_type;

CREATE TYPE workout_item_type AS ENUM ('exercise', 'custom_exercise');

ALTER TABLE workout_items
  ALTER COLUMN item_type TYPE workout_item_type
  USING item_type::workout_item_type;

-- ============================================
-- 4. RPC: upsert_workout_sections
-- ============================================
-- Atomically replaces all sections + items for a workout.
-- Used by both createWorkout and updateWorkout.
--
-- p_sections shape:
-- [
--   {
--     "title": "Strength",
--     "order_index": 0,
--     "block_type": "strength",       -- nullable
--     "repeat_scheme": "x5",          -- nullable
--     "items": [
--       {
--         "order_index": 0,
--         "item_type": "exercise",
--         "exercise_id": "uuid",       -- required for exercise
--         "sets": 5,                   -- nullable
--         "reps": 3,                   -- nullable
--         "percentage": 75.00,         -- nullable
--         "max_type_reference": "1rm", -- nullable
--         "weight_kg": null,           -- nullable
--         "content": null,             -- required for custom_exercise (name)
--         "notes": "Scale: empty bar"  -- nullable
--       }
--     ]
--   }
-- ]

CREATE OR REPLACE FUNCTION public.upsert_workout_sections(
  p_workout_id UUID,
  p_sections JSONB
)
RETURNS VOID AS $$
DECLARE
  v_section JSONB;
  v_section_id UUID;
  v_item JSONB;
BEGIN
  -- Verify the workout exists and caller has coach/admin access
  IF NOT EXISTS (
    SELECT 1 FROM workouts w
    JOIN gym_memberships gm ON gm.gym_id = w.gym_id
    WHERE w.id = p_workout_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('coach', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized or workout not found';
  END IF;

  -- Delete all existing sections (cascade deletes items)
  DELETE FROM workout_sections WHERE workout_id = p_workout_id;

  -- Insert new sections and their items
  FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
  LOOP
    -- Insert section
    INSERT INTO workout_sections (
      workout_id,
      title,
      order_index,
      block_type,
      repeat_scheme
    ) VALUES (
      p_workout_id,
      v_section->>'title',
      (v_section->>'order_index')::INTEGER,
      v_section->>'block_type',
      v_section->>'repeat_scheme'
    )
    RETURNING id INTO v_section_id;

    -- Insert items for this section
    IF v_section->'items' IS NOT NULL AND jsonb_array_length(v_section->'items') > 0 THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_section->'items')
      LOOP
        INSERT INTO workout_items (
          section_id,
          order_index,
          item_type,
          exercise_id,
          sets,
          reps,
          percentage,
          max_type_reference,
          weight_kg,
          content,
          notes
        ) VALUES (
          v_section_id,
          (v_item->>'order_index')::INTEGER,
          (v_item->>'item_type')::workout_item_type,
          (v_item->>'exercise_id')::UUID,
          (v_item->>'sets')::INTEGER,
          (v_item->>'reps')::INTEGER,
          (v_item->>'percentage')::DECIMAL(5,2),
          v_item->>'max_type_reference',
          (v_item->>'weight_kg')::DECIMAL(7,3),
          v_item->>'content',
          v_item->>'notes'
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
