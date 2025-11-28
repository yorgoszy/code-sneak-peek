-- Enable realtime for sprint_timing_results table
ALTER TABLE sprint_timing_results REPLICA IDENTITY FULL;

-- Add the table to supabase_realtime publication if not already there
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