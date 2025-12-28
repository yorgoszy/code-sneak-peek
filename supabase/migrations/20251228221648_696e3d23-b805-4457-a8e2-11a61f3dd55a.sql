-- Add is_paid column to coach_subscriptions table
ALTER TABLE public.coach_subscriptions
ADD COLUMN is_paid BOOLEAN DEFAULT true;