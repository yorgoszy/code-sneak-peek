-- Add late registration deadline and location URL to competitions
ALTER TABLE public.federation_competitions 
  ADD COLUMN late_registration_deadline date,
  ADD COLUMN location_url text;

-- Add late registration fee to categories
ALTER TABLE public.federation_competition_categories
  ADD COLUMN late_registration_fee numeric;