-- Track which corner (red/blue) our athlete is in
ALTER TABLE public.muaythai_fights
  ADD COLUMN IF NOT EXISTS our_corner text NOT NULL DEFAULT 'red';

-- Soft constraint (CHECK is fine here, value is immutable enumish)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'muaythai_fights_our_corner_check'
  ) THEN
    ALTER TABLE public.muaythai_fights
      ADD CONSTRAINT muaythai_fights_our_corner_check
      CHECK (our_corner IN ('red','blue'));
  END IF;
END$$;

-- Best-effort backfill: link orphan fights (match_video_id IS NULL) to a match_video
-- where our athlete matches red_athlete_id (single unambiguous candidate).
UPDATE public.muaythai_fights f
SET match_video_id = mv.id, our_corner = 'red'
FROM public.match_videos mv
WHERE f.match_video_id IS NULL
  AND mv.red_athlete_id = f.user_id
  AND (
    SELECT count(*) FROM public.match_videos mv2
    WHERE mv2.red_athlete_id = f.user_id OR mv2.blue_athlete_id = f.user_id
  ) = 1
  AND NOT EXISTS (
    SELECT 1 FROM public.muaythai_fights f2
    WHERE f2.match_video_id = mv.id AND f2.id <> f.id
  );

UPDATE public.muaythai_fights f
SET match_video_id = mv.id, our_corner = 'blue'
FROM public.match_videos mv
WHERE f.match_video_id IS NULL
  AND mv.blue_athlete_id = f.user_id
  AND (
    SELECT count(*) FROM public.match_videos mv2
    WHERE mv2.red_athlete_id = f.user_id OR mv2.blue_athlete_id = f.user_id
  ) = 1
  AND NOT EXISTS (
    SELECT 1 FROM public.muaythai_fights f2
    WHERE f2.match_video_id = mv.id AND f2.id <> f.id
  );