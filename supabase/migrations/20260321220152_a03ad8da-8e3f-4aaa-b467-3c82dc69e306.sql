-- Fix: Replace permissive INSERT on program_purchases
-- Only allow users to insert their own pending purchases with a stripe session
DROP POLICY IF EXISTS "Authenticated can insert purchases" ON public.program_purchases;

CREATE POLICY "Users can insert own pending purchases"
  ON public.program_purchases FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_app_user_id_for_programs(auth.uid())
    AND status = 'pending'
    AND stripe_session_id IS NOT NULL
  );