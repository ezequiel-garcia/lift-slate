-- Fast RPC function that bypasses RLS cascade for workout fetching
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
                  'max_type_reference', wi.max_type_reference,
                  'weight_kg', wi.weight_kg, 'content', wi.content,
                  'notes', wi.notes,
                  'exercises', CASE WHEN wi.exercise_id IS NOT NULL THEN (
                    SELECT jsonb_build_object('name', e.name, 'category', e.category)
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
