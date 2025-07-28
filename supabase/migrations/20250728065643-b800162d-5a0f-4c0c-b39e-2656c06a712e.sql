-- Προσθήκη στήλης is_free στον πίνακα offers
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;