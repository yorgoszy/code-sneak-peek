-- Add workout_format and workout_duration columns to program_blocks table
ALTER TABLE program_blocks 
ADD COLUMN IF NOT EXISTS workout_format TEXT,
ADD COLUMN IF NOT EXISTS workout_duration TEXT;