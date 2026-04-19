-- Add sport field to federations
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS sport text;

-- Extend abuse_reports
ALTER TABLE public.abuse_reports
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coach_name_text text,
  ADD COLUMN IF NOT EXISTS sport text;

CREATE INDEX IF NOT EXISTS idx_abuse_reports_club_id ON public.abuse_reports(club_id);