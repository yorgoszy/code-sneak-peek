-- Επιτρέπουμε στους χρήστες να εισάγουν payments
CREATE POLICY "Users can insert their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE app_users.id = payments.user_id 
    AND app_users.auth_user_id = auth.uid()
  )
);

-- Επιτρέπουμε στους admins να εισάγουν οποιαδήποτε payments
CREATE POLICY "Admins can manage all payments" 
ON public.payments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role = 'admin'
  )
);