-- Add columns for monthly and weekly phases to saved_macrocycles
ALTER TABLE saved_macrocycles 
ADD COLUMN IF NOT EXISTS monthly_phases jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weekly_phases jsonb DEFAULT '[]'::jsonb;