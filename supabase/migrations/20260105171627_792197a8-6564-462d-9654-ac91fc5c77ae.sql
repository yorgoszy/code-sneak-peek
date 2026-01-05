-- Update existing data from time_cap to non_stop
UPDATE program_blocks SET workout_format = 'non_stop' WHERE workout_format = 'time_cap';

-- Drop and recreate the constraint with new value
ALTER TABLE program_blocks DROP CONSTRAINT IF EXISTS program_blocks_workout_format_check;
ALTER TABLE program_blocks ADD CONSTRAINT program_blocks_workout_format_check 
  CHECK (workout_format IN ('non_stop', 'emom', 'for_time', 'amrap'));