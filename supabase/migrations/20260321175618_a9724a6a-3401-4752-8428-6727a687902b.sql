-- Drop anon write policies on competition_match_judge_scores
DROP POLICY IF EXISTS "Anon can insert judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Anon can update judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Anon can read judge scores" ON public.competition_match_judge_scores;

-- Fix user_awards: change public SELECT policies to authenticated
DROP POLICY IF EXISTS "Anyone can view displayed awards" ON public.user_awards;
CREATE POLICY "Anyone can view displayed awards"
  ON public.user_awards FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view their own awards" ON public.user_awards;
CREATE POLICY "Users can view their own awards"
  ON public.user_awards FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id_for_programs(auth.uid()));