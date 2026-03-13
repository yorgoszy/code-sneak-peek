
-- Add competition flow type: 'weigh_in_first' (current default) or 'draw_first'
ALTER TABLE public.federation_competitions 
  ADD COLUMN IF NOT EXISTS competition_flow text NOT NULL DEFAULT 'weigh_in_first',
  ADD COLUMN IF NOT EXISTS end_date text;

-- Add competition_day to matches so federation can assign matches to specific days
ALTER TABLE public.competition_matches 
  ADD COLUMN IF NOT EXISTS competition_day date;

-- Add competition_day to competition_weigh_ins for day-based weigh-in filtering
-- (Not needed - weigh-in already links to athlete, we filter by match day)
