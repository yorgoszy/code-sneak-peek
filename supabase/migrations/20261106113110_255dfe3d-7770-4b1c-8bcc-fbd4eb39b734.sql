ALTER TABLE public.coach_receipts
  ADD COLUMN IF NOT EXISTS mydata_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS mydata_error text,
  ADD COLUMN IF NOT EXISTS mydata_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS mydata_uid text;
UPDATE public.coach_receipts SET mydata_status = 'sent' WHERE mark IS NOT NULL AND mark <> '';