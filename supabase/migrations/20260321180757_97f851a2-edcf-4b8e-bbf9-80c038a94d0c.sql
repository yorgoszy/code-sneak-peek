-- Drop all duplicate/permissive write policies on competition_match_judge_scores
DROP POLICY IF EXISTS "Authenticated can delete judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Authenticated can insert judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Authenticated can update judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Authenticated users can delete judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Authenticated users can insert judge scores" ON public.competition_match_judge_scores;
DROP POLICY IF EXISTS "Authenticated users can update judge scores" ON public.competition_match_judge_scores;

-- Create restricted write policy: only admins, coaches, and federation owners can manage judge scores
CREATE POLICY "Admin and federation manage judge scores"
  ON public.competition_match_judge_scores
  FOR ALL TO authenticated
  USING (
    public.is_admin_user() OR
    public.is_coach_user(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.competition_matches cm
      JOIN public.federation_competitions fc ON fc.id = cm.competition_id
      WHERE cm.id = competition_match_judge_scores.match_id
        AND fc.federation_id = public.get_app_user_id_for_programs(auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin_user() OR
    public.is_coach_user(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.competition_matches cm
      JOIN public.federation_competitions fc ON fc.id = cm.competition_id
      WHERE cm.id = competition_match_judge_scores.match_id
        AND fc.federation_id = public.get_app_user_id_for_programs(auth.uid())
    )
  );