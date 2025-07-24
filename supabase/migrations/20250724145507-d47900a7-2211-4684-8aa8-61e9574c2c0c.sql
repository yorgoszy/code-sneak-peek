-- Προσθήκη στήλης payment_id στον πίνακα receipts για σύνδεση με πληρωμές
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id);

-- Δημιουργία index για καλύτερη απόδοση
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);

-- Ενημέρωση RLS policies για receipts να επιτρέπει στους χρήστες να βλέπουν τις δικές τους αποδείξεις
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
CREATE POLICY "Users can view their own receipts" 
ON public.receipts 
FOR SELECT 
USING (
  user_id IN (
    SELECT app_users.id 
    FROM app_users 
    WHERE app_users.auth_user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);

-- Policy για admins να μπορούν να δημιουργούν αποδείξεις
DROP POLICY IF EXISTS "Admins can manage receipts" ON public.receipts;
CREATE POLICY "Admins can manage receipts" 
ON public.receipts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);

-- Policy για edge functions (service role) να μπορούν να δημιουργούν αποδείξεις
DROP POLICY IF EXISTS "Service role can manage receipts" ON public.receipts;
CREATE POLICY "Service role can manage receipts" 
ON public.receipts 
FOR ALL 
USING (true)
WITH CHECK (true);