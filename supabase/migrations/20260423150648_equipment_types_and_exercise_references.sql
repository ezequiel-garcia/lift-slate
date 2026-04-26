-- ============================================
-- MIGRATION: EQUIPMENT TYPES & POLYMORPHIC EXERCISE REFERENCES
-- ============================================
-- Adds equipment_type to exercises (drops movement category).
-- Renames maxes -> exercise_references with polymorphic reference_type + reps.
-- Adds prescription_mode to workout_items for non-percentage prescriptions.

BEGIN;

-- ============================================
-- 1) NEW ENUMS
-- ============================================
CREATE TYPE equipment_type AS ENUM (
  'barbell', 'dumbbell', 'kettlebell', 'bodyweight', 'machine', 'other'
);

CREATE TYPE reference_type AS ENUM (
  'one_rep_max', 'working_weight', 'max_reps'
);

CREATE TYPE prescription_mode AS ENUM (
  'percentage', 'working_weight', 'heavy', 'easy', 'absolute', 'reps_only', 'bodyweight'
);

-- ============================================
-- 2) EXERCISES: add equipment_type, drop category
-- ============================================
ALTER TABLE exercises
  ADD COLUMN equipment_type equipment_type NOT NULL DEFAULT 'barbell';

-- Backfill known non-barbell default exercises
UPDATE exercises SET equipment_type = 'kettlebell'
  WHERE is_default = true AND name IN (
    'Kettlebell Deadlift',
    'Single-Arm Kettlebell Swing',
    'Goblet Squat'
  );

UPDATE exercises SET equipment_type = 'dumbbell'
  WHERE is_default = true AND name IN (
    'Dumbbell Bench Press',
    'Dumbbell Incline Press'
  );

UPDATE exercises SET equipment_type = 'bodyweight'
  WHERE is_default = true AND name IN (
    'Pull-Up',
    'Chin-Up',
    'Dips',
    'Plank',
    'Side Plank',
    'Toes-to-Bar',
    'Hollow Hold',
    'Burpee'
  );

ALTER TABLE exercises DROP COLUMN category;
DROP TYPE exercise_category;

-- ============================================
-- 3) RENAME maxes -> exercise_references
-- ============================================
ALTER TABLE maxes RENAME TO exercise_references;
ALTER INDEX idx_maxes_user_exercise RENAME TO idx_exercise_references_user_exercise;
ALTER TRIGGER maxes_updated_at ON exercise_references RENAME TO exercise_references_updated_at;

-- Polymorphic columns
ALTER TABLE exercise_references
  ADD COLUMN reference_type reference_type NOT NULL DEFAULT 'one_rep_max',
  ADD COLUMN reps INTEGER,
  ALTER COLUMN weight_kg DROP NOT NULL;

-- A row must have weight_kg (for weight-based) OR reps (for rep-based), not both
ALTER TABLE exercise_references
  ADD CONSTRAINT exercise_references_value_check CHECK (
    (reference_type IN ('one_rep_max', 'working_weight')
      AND weight_kg IS NOT NULL AND reps IS NULL)
    OR (reference_type = 'max_reps'
      AND reps IS NOT NULL AND weight_kg IS NULL)
  );

-- Rename RLS policies for clarity (bodies unchanged)
ALTER POLICY "Users can view own maxes"
  ON exercise_references RENAME TO "Users can view own exercise references";
ALTER POLICY "Users can create own maxes"
  ON exercise_references RENAME TO "Users can create own exercise references";
ALTER POLICY "Users can update own maxes"
  ON exercise_references RENAME TO "Users can update own exercise references";
ALTER POLICY "Users can delete own maxes"
  ON exercise_references RENAME TO "Users can delete own exercise references";
ALTER POLICY "Coach/admin can view athlete maxes"
  ON exercise_references RENAME TO "Coach/admin can view athlete exercise references";
ALTER POLICY "Coach/admin can create athlete maxes"
  ON exercise_references RENAME TO "Coach/admin can create athlete exercise references";
ALTER POLICY "Coach/admin can update athlete maxes"
  ON exercise_references RENAME TO "Coach/admin can update athlete exercise references";

-- ============================================
-- 4) WORKOUT_ITEMS: add prescription_mode, drop max_type_reference
-- ============================================
ALTER TABLE workout_items
  ADD COLUMN prescription_mode prescription_mode;

-- Backfill existing items: percentage > absolute > reps_only
UPDATE workout_items SET prescription_mode = 'percentage'
  WHERE percentage IS NOT NULL;
UPDATE workout_items SET prescription_mode = 'absolute'
  WHERE prescription_mode IS NULL AND weight_kg IS NOT NULL;
UPDATE workout_items SET prescription_mode = 'reps_only'
  WHERE prescription_mode IS NULL AND reps IS NOT NULL;

ALTER TABLE workout_items DROP COLUMN max_type_reference;

-- ============================================
-- 5) REDEFINE RPCs TO USE NEW SCHEMA
-- ============================================

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
  IF NOT EXISTS (
    SELECT 1 FROM workouts w
    JOIN gym_memberships gm ON gm.gym_id = w.gym_id
    WHERE w.id = p_workout_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('coach', 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized or workout not found';
  END IF;

  DELETE FROM workout_sections WHERE workout_id = p_workout_id;

  FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
  LOOP
    INSERT INTO workout_sections (
      workout_id, title, order_index, block_type, repeat_scheme
    ) VALUES (
      p_workout_id,
      v_section->>'title',
      (v_section->>'order_index')::INTEGER,
      v_section->>'block_type',
      v_section->>'repeat_scheme'
    )
    RETURNING id INTO v_section_id;

    IF v_section->'items' IS NOT NULL AND jsonb_array_length(v_section->'items') > 0 THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_section->'items')
      LOOP
        INSERT INTO workout_items (
          section_id, order_index, item_type, exercise_id,
          sets, reps, percentage, prescription_mode, weight_kg, content, notes
        ) VALUES (
          v_section_id,
          (v_item->>'order_index')::INTEGER,
          (v_item->>'item_type')::workout_item_type,
          (v_item->>'exercise_id')::UUID,
          (v_item->>'sets')::INTEGER,
          (v_item->>'reps')::INTEGER,
          (v_item->>'percentage')::DECIMAL(5,2),
          (v_item->>'prescription_mode')::prescription_mode,
          (v_item->>'weight_kg')::DECIMAL(7,3),
          v_item->>'content',
          v_item->>'notes'
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_workouts_for_date(p_gym_id uuid, p_date date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role gym_membership_role;
  v_result jsonb;
BEGIN
  SELECT role INTO v_role
  FROM gym_memberships
  WHERE user_id = auth.uid() AND gym_id = p_gym_id;

  IF v_role IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT coalesce(jsonb_agg(w_row), '[]'::jsonb) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', w.id, 'gym_id', w.gym_id, 'created_by', w.created_by,
      'title', w.title, 'scheduled_date', w.scheduled_date,
      'notes', w.notes, 'published', w.published,
      'created_at', w.created_at, 'updated_at', w.updated_at,
      'sections', coalesce((
        SELECT jsonb_agg(s_row ORDER BY ws.order_index)
        FROM (
          SELECT jsonb_build_object(
            'id', ws.id, 'workout_id', ws.workout_id,
            'title', ws.title, 'order_index', ws.order_index,
            'items', coalesce((
              SELECT jsonb_agg(i_row ORDER BY wi.order_index)
              FROM (
                SELECT jsonb_build_object(
                  'id', wi.id, 'section_id', wi.section_id,
                  'order_index', wi.order_index, 'item_type', wi.item_type,
                  'exercise_id', wi.exercise_id, 'sets', wi.sets,
                  'reps', wi.reps, 'percentage', wi.percentage,
                  'prescription_mode', wi.prescription_mode,
                  'weight_kg', wi.weight_kg, 'content', wi.content,
                  'notes', wi.notes,
                  'exercises', CASE WHEN wi.exercise_id IS NOT NULL THEN (
                    SELECT jsonb_build_object(
                      'name', e.name,
                      'equipment_type', e.equipment_type
                    )
                    FROM exercises e WHERE e.id = wi.exercise_id
                  ) ELSE NULL END
                ) AS i_row, wi.order_index
                FROM workout_items wi WHERE wi.section_id = ws.id
              ) sub_i
            ), '[]'::jsonb)
          ) AS s_row, ws.order_index
          FROM workout_sections ws WHERE ws.workout_id = w.id
        ) sub_s
      ), '[]'::jsonb)
    ) AS w_row
    FROM workouts w
    WHERE w.gym_id = p_gym_id AND w.scheduled_date = p_date
      AND (w.published = true OR v_role IN ('coach', 'admin'))
    ORDER BY w.created_at
  ) sub_w;

  RETURN v_result;
END;
$$;

COMMIT;
