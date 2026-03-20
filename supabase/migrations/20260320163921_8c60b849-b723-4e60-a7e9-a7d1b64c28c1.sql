-- Fix: Drop overly permissive public SELECT policy on expenses table
DROP POLICY IF EXISTS "Everyone can view expenses" ON public.expenses;