
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all subscription types" ON public.subscription_types;
DROP POLICY IF EXISTS "Admins can insert subscription types" ON public.subscription_types;
DROP POLICY IF EXISTS "Admins can update subscription types" ON public.subscription_types;
DROP POLICY IF EXISTS "Admins can delete subscription types" ON public.subscription_types;
DROP POLICY IF EXISTS "Users can view active subscription types" ON public.subscription_types;

-- Create correct policies using auth_user_id
CREATE POLICY "Admins can view all subscription types" ON public.subscription_types
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert subscription types" ON public.subscription_types
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update subscription types" ON public.subscription_types
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete subscription types" ON public.subscription_types
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy for non-admins to view active subscription types
CREATE POLICY "Users can view active subscription types" ON public.subscription_types
FOR SELECT 
USING (is_active = true);
