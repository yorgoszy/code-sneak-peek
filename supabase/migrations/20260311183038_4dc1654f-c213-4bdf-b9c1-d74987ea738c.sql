ALTER TABLE public.competition_rings
  ADD COLUMN IF NOT EXISTS timer_running_since timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timer_remaining_seconds integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timer_current_round integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS timer_is_break boolean DEFAULT false;