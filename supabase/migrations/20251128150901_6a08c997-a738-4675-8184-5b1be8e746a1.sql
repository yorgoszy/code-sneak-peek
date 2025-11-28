-- Enable realtime for sprint_timing_results table
ALTER TABLE sprint_timing_results REPLICA IDENTITY FULL;

-- Add to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'sprint_timing_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sprint_timing_results;
  END IF;
END $$;