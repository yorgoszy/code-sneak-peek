
-- 1) Link child record to athlete app_user
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS athlete_app_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_children_athlete_app_user_id ON public.children(athlete_app_user_id);

-- 2) RLS: parents can view their children's fights
DROP POLICY IF EXISTS "Parents can view their children fights" ON public.muaythai_fights;
CREATE POLICY "Parents can view their children fights"
ON public.muaythai_fights
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.children c
    JOIN public.app_users parent ON parent.id = c.parent_id
    WHERE c.athlete_app_user_id = muaythai_fights.user_id
      AND parent.auth_user_id = auth.uid()
  )
);

-- 3) Backfill video_url from match_videos for landing/gallery
UPDATE public.muaythai_fights mf
SET video_url = mv.youtube_url
FROM public.match_videos mv
WHERE mf.match_video_id = mv.id
  AND mf.video_url IS NULL
  AND mv.youtube_url IS NOT NULL;
