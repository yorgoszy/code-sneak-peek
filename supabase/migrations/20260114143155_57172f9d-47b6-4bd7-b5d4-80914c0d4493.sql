-- Add is_active field to coach_profiles
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;

-- Add subscription_end_date for tracking
ALTER TABLE public.coach_profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Add comments
COMMENT ON COLUMN public.coach_profiles.is_active IS 'Whether the coach has an active HYPERsync subscription';
COMMENT ON COLUMN public.coach_profiles.subscription_end_date IS 'End date of the current subscription';