ALTER TABLE public.match_videos
  ADD COLUMN IF NOT EXISTS red_athlete_name text,
  ADD COLUMN IF NOT EXISTS blue_athlete_name text;