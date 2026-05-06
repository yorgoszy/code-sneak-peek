ALTER TABLE public.muaythai_fights
  ADD COLUMN IF NOT EXISTS competition_name text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Public can view public fight videos" ON public.muaythai_fights;
CREATE POLICY "Public can view public fight videos"
  ON public.muaythai_fights
  FOR SELECT
  TO anon, authenticated
  USING (video_url IS NOT NULL AND is_public = true);