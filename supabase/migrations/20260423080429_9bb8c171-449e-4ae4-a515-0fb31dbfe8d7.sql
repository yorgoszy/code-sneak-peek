-- Live events table
CREATE TABLE public.live_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Live event rings table
CREATE TABLE public.live_event_rings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.live_events(id) ON DELETE CASCADE,
  ring_name TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_event_rings_event_id ON public.live_event_rings(event_id);
CREATE INDEX idx_live_events_active ON public.live_events(is_active);

-- Enable RLS
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_event_rings ENABLE ROW LEVEL SECURITY;

-- Public read for active events
CREATE POLICY "Anyone can view active live events"
ON public.live_events FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all live events"
ON public.live_events FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert live events"
ON public.live_events FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update live events"
ON public.live_events FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete live events"
ON public.live_events FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- Rings policies
CREATE POLICY "Anyone can view rings of active events"
ON public.live_event_rings FOR SELECT
USING (EXISTS (SELECT 1 FROM public.live_events WHERE id = event_id AND is_active = true));

CREATE POLICY "Admins can view all rings"
ON public.live_event_rings FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert rings"
ON public.live_event_rings FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update rings"
ON public.live_event_rings FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete rings"
ON public.live_event_rings FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_live_events_updated_at
BEFORE UPDATE ON public.live_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_live_event_rings_updated_at
BEFORE UPDATE ON public.live_event_rings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();