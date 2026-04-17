
CREATE TABLE public.landing_chat_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  interested_program TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  language TEXT DEFAULT 'el',
  user_agent TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_landing_chat_leads_session ON public.landing_chat_leads(session_id);
CREATE INDEX idx_landing_chat_leads_created ON public.landing_chat_leads(created_at DESC);

ALTER TABLE public.landing_chat_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can insert their own session
CREATE POLICY "Anyone can create chat sessions"
ON public.landing_chat_leads
FOR INSERT
WITH CHECK (true);

-- Anyone can update their own session by session_id (used from edge function with service role anyway, but allow client too)
CREATE POLICY "Anyone can update chat sessions"
ON public.landing_chat_leads
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view all chat leads"
ON public.landing_chat_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete
CREATE POLICY "Admins can delete chat leads"
ON public.landing_chat_leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE TRIGGER update_landing_chat_leads_updated_at
BEFORE UPDATE ON public.landing_chat_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
