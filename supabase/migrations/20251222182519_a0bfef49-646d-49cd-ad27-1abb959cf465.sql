-- Add sub-phase columns to user_weekly_phases for strength training phases
ALTER TABLE public.user_weekly_phases
ADD COLUMN IF NOT EXISTS primary_subphase text,
ADD COLUMN IF NOT EXISTS secondary_subphase text;

-- Add comment to explain the columns
COMMENT ON COLUMN public.user_weekly_phases.primary_subphase IS 'Primary strength sub-phase (starting-strength, explosive-strength, reactive-strength)';
COMMENT ON COLUMN public.user_weekly_phases.secondary_subphase IS 'Secondary strength sub-phase (starting-strength, explosive-strength, reactive-strength)';