-- Add effort fields to program_days table
ALTER TABLE public.program_days 
ADD COLUMN IF NOT EXISTS upper_effort text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS lower_effort text DEFAULT 'none';

-- Add check constraint for valid values
ALTER TABLE public.program_days 
ADD CONSTRAINT check_upper_effort CHECK (upper_effort IN ('none', 'DE', 'ME')),
ADD CONSTRAINT check_lower_effort CHECK (lower_effort IN ('none', 'DE', 'ME'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_program_days_upper_effort ON public.program_days(upper_effort);
CREATE INDEX IF NOT EXISTS idx_program_days_lower_effort ON public.program_days(lower_effort);

-- Comment on columns
COMMENT ON COLUMN public.program_days.upper_effort IS 'Upper body effort type: none, DE (Dynamic Effort), ME (Max Effort)';
COMMENT ON COLUMN public.program_days.lower_effort IS 'Lower body effort type: none, DE (Dynamic Effort), ME (Max Effort)';