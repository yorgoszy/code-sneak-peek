-- Add available_in_shop column to subscription_types table
ALTER TABLE public.subscription_types 
ADD COLUMN available_in_shop BOOLEAN NOT NULL DEFAULT false;