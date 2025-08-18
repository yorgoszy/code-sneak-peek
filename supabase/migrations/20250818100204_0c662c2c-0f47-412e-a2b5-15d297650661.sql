-- Fix critical security vulnerability in payments table
-- Remove the dangerous "Everyone can view completed payments" policy that exposes financial data publicly

-- Drop the problematic policy that allows anyone to view completed payments
DROP POLICY IF EXISTS "Everyone can view completed payments" ON public.payments;

-- The existing secure policies remain:
-- 1. "Admins can manage all payments" - allows admins to manage all payments (secure)
-- 2. "Users can view their own payments" - allows users to see only their own payments (secure)  
-- 3. "Users can insert their own payments" - allows users to create their own payments (secure)

-- Add performance index on user_id for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- Add a comment to document the security fix
COMMENT ON TABLE public.payments IS 'Contains sensitive financial data. Access restricted by RLS policies to payment owners and admins only.';