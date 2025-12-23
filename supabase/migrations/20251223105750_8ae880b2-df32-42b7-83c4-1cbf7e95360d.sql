-- Add reps_mode to training_phase_config table for phase-level configuration
ALTER TABLE public.training_phase_config
ADD COLUMN IF NOT EXISTS reps_mode text DEFAULT 'reps';

-- Add comment explaining the field
COMMENT ON COLUMN public.training_phase_config.reps_mode IS 'Mode for reps: reps, time, meter';