CREATE POLICY "Authenticated users can delete judge scores"
ON public.competition_match_judge_scores
FOR DELETE
TO authenticated
USING (true);