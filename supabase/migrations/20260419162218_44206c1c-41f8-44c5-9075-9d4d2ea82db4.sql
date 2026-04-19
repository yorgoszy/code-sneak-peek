
CREATE TABLE public.acknowledged_abuse_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_id UUID NOT NULL REFERENCES public.abuse_reports(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_id)
);

ALTER TABLE public.acknowledged_abuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acknowledgements"
ON public.acknowledged_abuse_reports
FOR SELECT
USING (
  user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can create their own acknowledgements"
ON public.acknowledged_abuse_reports
FOR INSERT
WITH CHECK (
  user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Users can delete their own acknowledgements"
ON public.acknowledged_abuse_reports
FOR DELETE
USING (
  user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE INDEX idx_ack_abuse_reports_user ON public.acknowledged_abuse_reports(user_id);
CREATE INDEX idx_ack_abuse_reports_report ON public.acknowledged_abuse_reports(report_id);
