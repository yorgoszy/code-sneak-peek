-- Remove sensitive/PII tables from Supabase Realtime broadcasts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'abuse_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.abuse_reports;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'acknowledged_abuse_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.acknowledged_abuse_reports;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.app_users;
  END IF;
END $$;

-- Prevent anonymous/public users from updating arbitrary landing chat leads.
DROP POLICY IF EXISTS "Anyone can update chat sessions" ON public.landing_chat_leads;

CREATE POLICY "Admins can update chat leads"
ON public.landing_chat_leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role = 'admin'
  )
);
