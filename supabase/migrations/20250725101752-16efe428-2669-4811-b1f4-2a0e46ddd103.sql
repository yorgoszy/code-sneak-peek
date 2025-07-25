-- Διόρθωση RLS policies για έσοδα, έξοδα και συνδρομές

-- Ενημέρωση πολιτικής για payments (έσοδα)
DROP POLICY IF EXISTS "Everyone can view completed payments" ON public.payments;
CREATE POLICY "Everyone can view completed payments" ON public.payments
FOR SELECT USING (status = 'completed');

-- Ενημέρωση πολιτικής για expenses (έξοδα) 
DROP POLICY IF EXISTS "Everyone can view expenses" ON public.expenses;
CREATE POLICY "Everyone can view expenses" ON public.expenses
FOR SELECT USING (true);

-- Ενημέρωση πολιτικής για user_subscriptions (συνδρομές)
DROP POLICY IF EXISTS "Everyone can view active subscriptions" ON public.user_subscriptions;
CREATE POLICY "Everyone can view active subscriptions" ON public.user_subscriptions
FOR SELECT USING (true);