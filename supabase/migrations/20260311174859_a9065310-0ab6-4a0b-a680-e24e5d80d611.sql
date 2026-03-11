
-- Table for storing individual judge scores per match per round
CREATE TABLE public.competition_match_judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.competition_matches(id) ON DELETE CASCADE,
  judge_number SMALLINT NOT NULL CHECK (judge_number BETWEEN 1 AND 3),
  round SMALLINT NOT NULL CHECK (round BETWEEN 1 AND 3),
  athlete1_score SMALLINT NOT NULL DEFAULT 0,
  athlete2_score SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, judge_number, round)
);

-- Enable RLS
ALTER TABLE public.competition_match_judge_scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read scores
CREATE POLICY "Anyone can read judge scores"
  ON public.competition_match_judge_scores
  FOR SELECT TO authenticated
  USING (true);

-- Allow anyone authenticated to insert/update scores (federation users manage matches)
CREATE POLICY "Authenticated users can insert judge scores"
  ON public.competition_match_judge_scores
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update judge scores"
  ON public.competition_match_judge_scores
  FOR UPDATE TO authenticated
  USING (true);

-- Also allow anon access for judges who may not be logged in
CREATE POLICY "Anon can read judge scores"
  ON public.competition_match_judge_scores
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can insert judge scores"
  ON public.competition_match_judge_scores
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update judge scores"
  ON public.competition_match_judge_scores
  FOR UPDATE TO anon
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_match_judge_scores;
