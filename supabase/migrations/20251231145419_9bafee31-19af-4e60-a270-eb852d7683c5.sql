-- Make coach_user_id nullable in coach_subscriptions
ALTER TABLE public.coach_subscriptions
ALTER COLUMN coach_user_id DROP NOT NULL;

-- Make coach_user_id nullable in coach_receipts
ALTER TABLE public.coach_receipts
ALTER COLUMN coach_user_id DROP NOT NULL;