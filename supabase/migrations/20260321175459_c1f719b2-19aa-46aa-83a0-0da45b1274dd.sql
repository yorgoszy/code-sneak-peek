-- Fix user_awards: restrict INSERT to authenticated admin/coach only
DROP POLICY IF EXISTS "System can create awards" ON public.user_awards;
CREATE POLICY "Admins can create awards"
  ON public.user_awards FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_user(auth.uid()));

-- Fix competition_match_judge_scores: drop anon write policies, restrict to authenticated
DROP POLICY IF EXISTS "Allow anon insert judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Allow anon update judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Allow anon delete judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "anon_insert_judge_scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "anon_update_judge_scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "anon_delete_judge_scores" ON public.competition_match_judge_scores;

-- Check what policies exist and recreate for authenticated only
CREATE POLICY "Authenticated can insert judge scores"
  ON public.competition_match_judge_scores FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated can update judge scores"
  ON public.competition_match_judge_scores FOR UPDATE TO authenticated
  USING (true);
CREATE POLICY "Authenticated can delete judge scores"
  ON public.competition_match_judge_scores FOR DELETE TO authenticated
  USING (true);