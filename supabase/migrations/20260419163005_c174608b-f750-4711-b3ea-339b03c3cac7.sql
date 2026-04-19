ALTER TABLE public.abuse_reports REPLICA IDENTITY FULL;
ALTER TABLE public.acknowledged_abuse_reports REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.abuse_reports; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.acknowledged_abuse_reports; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;