-- Add new columns for public submissions
ALTER TABLE public.abuse_reports
  ADD COLUMN IF NOT EXISTS reporter_name TEXT,
  ADD COLUMN IF NOT EXISTS reporter_email TEXT,
  ADD COLUMN IF NOT EXISTS reporter_phone TEXT,
  ADD COLUMN IF NOT EXISTS club_name_text TEXT,
  ADD COLUMN IF NOT EXISTS club_address TEXT,
  ADD COLUMN IF NOT EXISTS club_city TEXT,
  ADD COLUMN IF NOT EXISTS club_country TEXT,
  ADD COLUMN IF NOT EXISTS is_public_submission BOOLEAN NOT NULL DEFAULT false;

-- Make athlete_id nullable so guests (without account) can submit
ALTER TABLE public.abuse_reports
  ALTER COLUMN athlete_id DROP NOT NULL;

-- Allow anonymous users to insert public submissions
DROP POLICY IF EXISTS "Public can submit abuse reports" ON public.abuse_reports;
CREATE POLICY "Public can submit abuse reports"
ON public.abuse_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (
  is_public_submission = true
  AND athlete_id IS NULL
  AND reporter_name IS NOT NULL
  AND reporter_email IS NOT NULL
);