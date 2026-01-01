-- Add coach_id column to foods table
ALTER TABLE public.foods 
ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_foods_coach_id ON public.foods(coach_id);