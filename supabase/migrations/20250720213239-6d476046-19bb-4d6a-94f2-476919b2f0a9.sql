-- Δημιουργία πίνακα για έξοδα
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number TEXT,
  category TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ενεργοποίηση Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Δημιουργία πολιτικών RLS για έξοδα
CREATE POLICY "Admins can manage all expenses" 
ON public.expenses 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);

-- Δημιουργία ευρετηρίων για καλύτερη απόδοση
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX idx_expenses_expense_number ON public.expenses(expense_number);

-- Δημιουργία trigger για automatic timestamp updates
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Προσθήκη στήλης user_id στον πίνακα receipts για σύνδεση με χρήστη
ALTER TABLE public.receipts ADD COLUMN user_id UUID REFERENCES app_users(id);