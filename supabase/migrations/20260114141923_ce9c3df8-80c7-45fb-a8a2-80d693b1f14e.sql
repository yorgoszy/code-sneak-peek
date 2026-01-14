-- Add coach_shop_only column to subscription_types
ALTER TABLE public.subscription_types 
ADD COLUMN IF NOT EXISTS coach_shop_only boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.subscription_types.coach_shop_only IS 'If true, this subscription type is only visible in coach profile shop, not in the main user shop';