-- Ενεργοποίηση realtime για τα tables που χρειάζονται για real-time updates
ALTER TABLE public.workout_completions REPLICA IDENTITY FULL;
ALTER TABLE public.program_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.app_users REPLICA IDENTITY FULL;

-- Προσθήκη των tables στο realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.program_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;