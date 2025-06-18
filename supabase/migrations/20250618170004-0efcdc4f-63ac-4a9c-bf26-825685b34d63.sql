
-- Enable realtime for exercises table
ALTER TABLE public.exercises REPLICA IDENTITY FULL;

-- Add exercises table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercises;
