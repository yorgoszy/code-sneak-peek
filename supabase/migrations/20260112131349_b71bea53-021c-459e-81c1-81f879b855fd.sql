ALTER TABLE public.receipts
ADD COLUMN IF NOT EXISTS invoice_uid TEXT,
ADD COLUMN IF NOT EXISTS qr_url TEXT;

CREATE INDEX IF NOT EXISTS idx_receipts_invoice_mark ON public.receipts (invoice_mark);
CREATE INDEX IF NOT EXISTS idx_receipts_mydata_status ON public.receipts (mydata_status);