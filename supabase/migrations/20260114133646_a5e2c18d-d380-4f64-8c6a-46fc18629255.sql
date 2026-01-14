-- Enable realtime for workout_stats table
ALTER TABLE public.workout_stats REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already there
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_stats;