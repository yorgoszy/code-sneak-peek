DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'competition_rings'
      AND policyname = 'Anon can view competition rings'
  ) THEN
    CREATE POLICY "Anon can view competition rings"
    ON public.competition_rings
    FOR SELECT
    TO anon
    USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'competition_matches'
      AND policyname = 'Anon can view competition matches'
  ) THEN
    CREATE POLICY "Anon can view competition matches"
    ON public.competition_matches
    FOR SELECT
    TO anon
    USING (true);
  END IF;
END
$$;