-- Step 1: Add new enum values (must be committed before use)
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'core';
ALTER TYPE exercise_category ADD VALUE IF NOT EXISTS 'conditioning';
