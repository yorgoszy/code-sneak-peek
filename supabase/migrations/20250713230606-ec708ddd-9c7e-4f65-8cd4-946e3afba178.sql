-- Change subscription_types duration from days to months
ALTER TABLE public.subscription_types 
DROP COLUMN duration_days,
ADD COLUMN duration_months integer NOT NULL DEFAULT 1;

-- Update existing subscription types to convert days to approximate months
-- This is a one-time conversion, adjust the values as needed for your business logic
UPDATE public.subscription_types 
SET duration_months = CASE 
  WHEN name ILIKE '%annual%' OR name ILIKE '%year%' THEN 12
  WHEN name ILIKE '%6%month%' OR name ILIKE '%semi%' THEN 6  
  WHEN name ILIKE '%3%month%' OR name ILIKE '%quarter%' THEN 3
  WHEN name ILIKE '%month%' THEN 1
  ELSE 1 -- Default to 1 month
END;

-- Update payments table to track months instead of days
ALTER TABLE public.payments 
DROP COLUMN subscription_duration_days,
ADD COLUMN subscription_duration_months integer;