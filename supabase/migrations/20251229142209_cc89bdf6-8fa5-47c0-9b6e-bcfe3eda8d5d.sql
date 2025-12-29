-- Add coach_id column to expenses table for coach filtering
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_coach_id ON public.expenses(coach_id);