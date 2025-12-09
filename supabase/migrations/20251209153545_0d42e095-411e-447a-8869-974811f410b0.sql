-- Επιτρέπει service role να διαχειρίζεται όλα τα stats
CREATE POLICY "Service role can manage all training stats" 
ON public.training_type_stats 
FOR ALL 
USING (true)
WITH CHECK (true);