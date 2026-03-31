-- Step 2: Insert new default exercises (requires enum values from 011 to be committed)
INSERT INTO exercises (name, category, is_default) VALUES
  ('Kettlebell Deadlift', 'pull', true),
  ('Dumbbell Bench Press', 'press', true),
  ('Dumbbell Incline Press', 'press', true),
  ('Strict Press', 'press', true),
  ('Dips', 'press', true),
  ('Pull-Up', 'pull', true),
  ('Chin-Up', 'pull', true),
  ('Plank', 'core', true),
  ('Side Plank', 'core', true),
  ('Toes-to-Bar', 'core', true),
  ('Hollow Hold', 'core', true),
  ('Burpee', 'conditioning', true),
  ('Single-Arm Kettlebell Swing', 'pull', true);
