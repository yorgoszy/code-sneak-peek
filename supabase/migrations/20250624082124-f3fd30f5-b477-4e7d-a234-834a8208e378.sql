
-- Enable Row Level Security on subscription_types table
ALTER TABLE public.subscription_types ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all subscription types
CREATE POLICY "Admins can view all subscription types" ON public.subscription_types
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to insert new subscription types
CREATE POLICY "Admins can insert subscription types" ON public.subscription_types
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update subscription types
CREATE POLICY "Admins can update subscription types" ON public.subscription_types
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete subscription types
CREATE POLICY "Admins can delete subscription types" ON public.subscription_types
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Also create a policy for non-admins to view active subscription types (for checkout purposes)
CREATE POLICY "Users can view active subscription types" ON public.subscription_types
FOR SELECT 
USING (is_active = true);
