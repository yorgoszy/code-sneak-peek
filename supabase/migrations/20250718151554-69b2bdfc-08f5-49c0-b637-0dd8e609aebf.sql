-- Δημιουργία πίνακα για αποδείξεις
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_vat TEXT,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mydata_status TEXT NOT NULL DEFAULT 'pending',
  mydata_id TEXT,
  invoice_mark TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ενεργοποίηση Row Level Security
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Δημιουργία πολιτικών RLS για αποδείξεις
CREATE POLICY "Admins can manage all receipts" 
ON public.receipts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);

CREATE POLICY "Users can view all receipts" 
ON public.receipts 
FOR SELECT 
USING (true);

-- Δημιουργία ευρετηρίων για καλύτερη απόδοση
CREATE INDEX idx_receipts_receipt_number ON public.receipts(receipt_number);
CREATE INDEX idx_receipts_issue_date ON public.receipts(issue_date DESC);
CREATE INDEX idx_receipts_mydata_status ON public.receipts(mydata_status);

-- Δημιουργία trigger για automatic timestamp updates
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();