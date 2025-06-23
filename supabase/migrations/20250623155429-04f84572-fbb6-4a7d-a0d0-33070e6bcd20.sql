
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Direct check for admin role using auth.uid()
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RETURN 'admin';
  END IF;
  
  RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policies using the security definer function
CREATE POLICY "Admins can view all users" ON public.app_users
  FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all users" ON public.app_users
  FOR UPDATE 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view own profile" ON public.app_users
  FOR SELECT 
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.app_users
  FOR UPDATE 
  USING (auth_user_id = auth.uid());
