-- Drop all coach-related policies first
DROP POLICY IF EXISTS "Coaches can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can view their programs" ON public.programs;
DROP POLICY IF EXISTS "Coaches can view their assignments" ON public.program_assignments;
DROP POLICY IF EXISTS "Coaches can view their receipts" ON public.receipts;
DROP POLICY IF EXISTS "Coaches can view their subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Coaches can view their strength tests" ON public.strength_test_sessions;
DROP POLICY IF EXISTS "Coaches can view their anthropometric tests" ON public.anthropometric_test_sessions;
DROP POLICY IF EXISTS "Coaches can view their endurance tests" ON public.endurance_test_sessions;
DROP POLICY IF EXISTS "Coaches can view their tests" ON public.tests;

-- Drop all coach INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Coaches can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can insert programs" ON public.programs;
DROP POLICY IF EXISTS "Coaches can update programs" ON public.programs;
DROP POLICY IF EXISTS "Coaches can insert assignments" ON public.program_assignments;
DROP POLICY IF EXISTS "Coaches can update assignments" ON public.program_assignments;
DROP POLICY IF EXISTS "Coaches can insert receipts" ON public.receipts;
DROP POLICY IF EXISTS "Coaches can update receipts" ON public.receipts;
DROP POLICY IF EXISTS "Coaches can insert subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Coaches can update subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Coaches can insert strength tests" ON public.strength_test_sessions;
DROP POLICY IF EXISTS "Coaches can update strength tests" ON public.strength_test_sessions;
DROP POLICY IF EXISTS "Coaches can insert anthropometric tests" ON public.anthropometric_test_sessions;
DROP POLICY IF EXISTS "Coaches can update anthropometric tests" ON public.anthropometric_test_sessions;
DROP POLICY IF EXISTS "Coaches can insert endurance tests" ON public.endurance_test_sessions;
DROP POLICY IF EXISTS "Coaches can update endurance tests" ON public.endurance_test_sessions;
DROP POLICY IF EXISTS "Coaches can insert tests" ON public.tests;
DROP POLICY IF EXISTS "Coaches can update tests" ON public.tests;

-- Drop all admin policies that might conflict
DROP POLICY IF EXISTS "admin_full_access_app_users" ON public.app_users;
DROP POLICY IF EXISTS "coach_access_own_users" ON public.app_users;
DROP POLICY IF EXISTS "user_view_own_profile" ON public.app_users;
DROP POLICY IF EXISTS "admin_manage_app_users" ON public.app_users;
DROP POLICY IF EXISTS "coach_manage_own_users" ON public.app_users;
DROP POLICY IF EXISTS "user_update_own_profile" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_policy" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_policy" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_policy" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_policy" ON public.app_users;

-- Drop any old app_users policies
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.app_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile and admins can update all" ON public.app_users;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.app_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.app_users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.app_users;

-- Now safely drop and recreate the helper functions
DROP FUNCTION IF EXISTS public.can_access_coach_data(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_coach_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_current_user_coach() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_app_user_id() CASCADE;

-- Create safe security definer functions that don't cause recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_auth_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.app_users WHERE auth_user_id = user_auth_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_app_user_id_safe(user_auth_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.app_users WHERE auth_user_id = user_auth_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_safe(user_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = user_auth_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coach_safe(user_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = user_auth_id AND role = 'coach'
  );
$$;

-- Create RLS policies for app_users using the safe functions
CREATE POLICY "app_users_select_policy" ON public.app_users
FOR SELECT USING (
  auth_user_id = auth.uid() 
  OR public.is_admin_safe(auth.uid()) 
  OR (public.is_coach_safe(auth.uid()) AND coach_id = public.get_app_user_id_safe(auth.uid()))
);

CREATE POLICY "app_users_insert_policy" ON public.app_users
FOR INSERT WITH CHECK (
  public.is_admin_safe(auth.uid()) 
  OR public.is_coach_safe(auth.uid())
);

CREATE POLICY "app_users_update_policy" ON public.app_users
FOR UPDATE USING (
  auth_user_id = auth.uid() 
  OR public.is_admin_safe(auth.uid()) 
  OR (public.is_coach_safe(auth.uid()) AND coach_id = public.get_app_user_id_safe(auth.uid()))
);

CREATE POLICY "app_users_delete_policy" ON public.app_users
FOR DELETE USING (
  public.is_admin_safe(auth.uid())
);