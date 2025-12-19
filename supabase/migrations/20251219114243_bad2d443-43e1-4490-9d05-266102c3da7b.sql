-- Drop the unique constraint that prevents multiple phases per month
ALTER TABLE public.user_annual_phases
DROP CONSTRAINT IF EXISTS user_annual_phases_user_id_year_month_key;

-- Add a new unique constraint that allows multiple phases per month
-- but prevents duplicate (user_id, year, month, phase) combinations
ALTER TABLE public.user_annual_phases
ADD CONSTRAINT user_annual_phases_user_id_year_month_phase_key 
UNIQUE (user_id, year, month, phase);