-- Προσθήκη πεδίου για προγραμματισμένα τεστ
ALTER TABLE public.tests 
ADD COLUMN scheduled_date date;

-- Προσθήκη πεδίου για κατάσταση τεστ (scheduled, completed, cancelled)
ALTER TABLE public.tests 
ADD COLUMN status text DEFAULT 'completed';

-- Δημιουργία index για καλύτερη performance
CREATE INDEX idx_tests_scheduled_date ON public.tests(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_tests_status ON public.tests(status);

-- Ενημέρωση RLS policies για scheduled tests
DROP POLICY IF EXISTS "Users can view their own tests" ON public.tests;

CREATE POLICY "Users can view their own tests" 
ON public.tests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.id = tests.user_id 
    AND app_users.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all tests" 
ON public.tests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);

CREATE POLICY "Trainers can manage tests" 
ON public.tests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'trainer'
  )
);