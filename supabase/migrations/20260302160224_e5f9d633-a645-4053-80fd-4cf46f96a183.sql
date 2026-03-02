
-- Junction table for many-to-many federation <-> club (coach) relationship
CREATE TABLE public.federation_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  federation_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(federation_id, club_id)
);

-- Enable RLS
ALTER TABLE public.federation_clubs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Federations can view their clubs"
  ON public.federation_clubs FOR SELECT
  USING (
    federation_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
    OR club_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
    OR public.is_admin_safe(auth.uid())
  );

CREATE POLICY "Federations can manage their clubs"
  ON public.federation_clubs FOR INSERT
  WITH CHECK (
    federation_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'federation'
    )
    OR public.is_admin_safe(auth.uid())
  );

CREATE POLICY "Federations can update their clubs"
  ON public.federation_clubs FOR UPDATE
  USING (
    federation_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
    OR public.is_admin_safe(auth.uid())
  );

CREATE POLICY "Federations can delete their clubs"
  ON public.federation_clubs FOR DELETE
  USING (
    federation_id IN (
      SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
    )
    OR public.is_admin_safe(auth.uid())
  );

-- Index for performance
CREATE INDEX idx_federation_clubs_federation_id ON public.federation_clubs(federation_id);
CREATE INDEX idx_federation_clubs_club_id ON public.federation_clubs(club_id);
