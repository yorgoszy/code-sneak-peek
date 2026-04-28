CREATE TABLE public.match_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  competition_name TEXT,
  match_date DATE,
  age_category TEXT,
  weight_category TEXT,
  youtube_url TEXT NOT NULL,
  start_seconds INTEGER,
  end_seconds INTEGER,
  red_athlete_id UUID,
  blue_athlete_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_videos_red ON public.match_videos(red_athlete_id);
CREATE INDEX idx_match_videos_blue ON public.match_videos(blue_athlete_id);
CREATE INDEX idx_match_videos_date ON public.match_videos(match_date DESC);

ALTER TABLE public.match_videos ENABLE ROW LEVEL SECURITY;

-- Public read (gallery is public)
CREATE POLICY "Anyone can view match videos"
ON public.match_videos
FOR SELECT
USING (true);

-- Admin write
CREATE POLICY "Admins can insert match videos"
ON public.match_videos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update match videos"
ON public.match_videos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete match videos"
ON public.match_videos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_match_videos_updated_at
BEFORE UPDATE ON public.match_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();