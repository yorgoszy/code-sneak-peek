ALTER TABLE ring_analysis_cameras REPLICA IDENTITY FULL;

-- Add RLS policy for anon to update cameras (mobile phone without auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ring_analysis_cameras' AND policyname = 'Anon can update ring cameras'
  ) THEN
    CREATE POLICY "Anon can update ring cameras"
      ON public.ring_analysis_cameras
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;