-- Προσθήκη στήλης offer_id στον πίνακα payments
ALTER TABLE public.payments 
ADD COLUMN offer_id UUID REFERENCES public.offers(id);