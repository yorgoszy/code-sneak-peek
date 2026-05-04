-- Link muaythai_fights to match_videos with a 1:1 relationship per match video
ALTER TABLE public.muaythai_fights
  ADD COLUMN IF NOT EXISTS match_video_id uuid;

-- Ensure only one fight (analysis) per match video
CREATE UNIQUE INDEX IF NOT EXISTS muaythai_fights_match_video_id_unique
  ON public.muaythai_fights (match_video_id)
  WHERE match_video_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS muaythai_fights_match_video_id_idx
  ON public.muaythai_fights (match_video_id);