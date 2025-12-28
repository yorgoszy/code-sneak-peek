-- Add coach_id to subscription_types for coach-specific subscription types
ALTER TABLE public.subscription_types 
ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_types_coach_id ON public.subscription_types(coach_id);