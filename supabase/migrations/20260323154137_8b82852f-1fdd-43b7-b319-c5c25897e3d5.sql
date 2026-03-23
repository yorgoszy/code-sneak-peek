-- Fix: restrict ai_global_knowledge SELECT to authenticated users only
DROP POLICY IF EXISTS "Everyone can read global knowledge" ON public.ai_global_knowledge;
CREATE POLICY "Authenticated users can read global knowledge"
  ON public.ai_global_knowledge
  FOR SELECT
  TO authenticated
  USING (true);