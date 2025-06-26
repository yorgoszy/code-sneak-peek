
-- Add percentage_1rm column to program_exercises table if it doesn't exist
ALTER TABLE program_exercises 
ADD COLUMN IF NOT EXISTS percentage_1rm numeric;

-- Add velocity_ms column to program_exercises table if it doesn't exist  
ALTER TABLE program_exercises 
ADD COLUMN IF NOT EXISTS velocity_ms numeric;
