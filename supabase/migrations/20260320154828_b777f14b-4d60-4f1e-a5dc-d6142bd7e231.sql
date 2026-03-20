-- Fix: Drop overly permissive RLS policies on program_assignments that allow anonymous access
DROP POLICY IF EXISTS "Users can create assignments" ON public.program_assignments;
DROP POLICY IF EXISTS "Users can update assignments" ON public.program_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.program_assignments;