-- ============================================
-- COACH RLS POLICIES - Phase 2
-- ============================================

-- Helper function to check if user can access data based on coach_id
CREATE OR REPLACE FUNCTION public.can_access_coach_data(data_coach_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  -- Get current user info
  SELECT id, role INTO v_user_id, v_role
  FROM public.app_users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- Admin sees everything
  IF v_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Coach sees their own data OR data with NULL coach_id (legacy/shared)
  IF v_role = 'coach' THEN
    RETURN (data_coach_id = v_user_id OR data_coach_id IS NULL);
  END IF;
  
  -- Other users - check if they belong to this coach
  RETURN FALSE;
END;
$$;

-- ============================================
-- APP_USERS - Coaches see only their users
-- ============================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Coaches can view their users" ON public.app_users;
DROP POLICY IF EXISTS "Coaches can update their users" ON public.app_users;

-- Coaches can view their assigned users
CREATE POLICY "Coaches can view their users" ON public.app_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.auth_user_id = auth.uid() 
    AND au.role = 'coach'
    AND (app_users.coach_id = au.id OR app_users.id = au.id)
  )
);

-- Coaches can update their assigned users
CREATE POLICY "Coaches can update their users" ON public.app_users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.auth_user_id = auth.uid() 
    AND au.role = 'coach'
    AND (app_users.coach_id = au.id OR app_users.id = au.id)
  )
);

-- Coaches can insert new users (assigned to them)
DROP POLICY IF EXISTS "Coaches can insert users" ON public.app_users;
CREATE POLICY "Coaches can insert users" ON public.app_users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.auth_user_id = auth.uid() 
    AND au.role = 'coach'
  )
);

-- ============================================
-- EXERCISES - Coaches see shared + their own
-- ============================================

DROP POLICY IF EXISTS "Coaches can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can manage their exercises" ON public.exercises;

-- Coaches can view shared exercises (coach_id IS NULL) + their own
CREATE POLICY "Coaches can view exercises" ON public.exercises
FOR SELECT USING (
  coach_id IS NULL 
  OR public.can_access_coach_data(coach_id)
);

-- Coaches can insert their own exercises
CREATE POLICY "Coaches can insert exercises" ON public.exercises
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

-- Coaches can update/delete only their own exercises
CREATE POLICY "Coaches can update their exercises" ON public.exercises
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can delete their exercises" ON public.exercises
FOR DELETE USING (
  coach_id = public.get_current_app_user_id() 
  OR public.is_current_user_admin()
);

-- ============================================
-- PROGRAMS - Coaches see only their programs
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage their programs" ON public.programs;
DROP POLICY IF EXISTS "Coaches can view their programs" ON public.programs;

CREATE POLICY "Coaches can view their programs" ON public.programs
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert programs" ON public.programs
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their programs" ON public.programs
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can delete their programs" ON public.programs
FOR DELETE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

-- ============================================
-- PROGRAM_ASSIGNMENTS - Coaches see their assignments
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage their assignments" ON public.program_assignments;
DROP POLICY IF EXISTS "Coaches can view their assignments" ON public.program_assignments;

CREATE POLICY "Coaches can view their assignments" ON public.program_assignments
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert assignments" ON public.program_assignments
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their assignments" ON public.program_assignments
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can delete their assignments" ON public.program_assignments
FOR DELETE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

-- ============================================
-- RECEIPTS - Coaches see their receipts
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage their receipts" ON public.receipts;
DROP POLICY IF EXISTS "Coaches can view their receipts" ON public.receipts;

CREATE POLICY "Coaches can view their receipts" ON public.receipts
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert receipts" ON public.receipts
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their receipts" ON public.receipts
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

-- ============================================
-- USER_SUBSCRIPTIONS - Coaches see their subscriptions
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage their subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Coaches can view their subscriptions" ON public.user_subscriptions;

CREATE POLICY "Coaches can view their subscriptions" ON public.user_subscriptions
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert subscriptions" ON public.user_subscriptions
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their subscriptions" ON public.user_subscriptions
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

-- ============================================
-- STRENGTH_TEST_SESSIONS - Coaches see their tests
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage their strength tests" ON public.strength_test_sessions;
DROP POLICY IF EXISTS "Coaches can view their strength tests" ON public.strength_test_sessions;

CREATE POLICY "Coaches can view their strength tests" ON public.strength_test_sessions
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert strength tests" ON public.strength_test_sessions
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their strength tests" ON public.strength_test_sessions
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

-- ============================================
-- ANTHROPOMETRIC_TEST_SESSIONS - Coaches see their tests
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage their anthropometric tests" ON public.anthropometric_test_sessions;
DROP POLICY IF EXISTS "Coaches can view their anthropometric tests" ON public.anthropometric_test_sessions;

CREATE POLICY "Coaches can view their anthropometric tests" ON public.anthropometric_test_sessions
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert anthropometric tests" ON public.anthropometric_test_sessions
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their anthropometric tests" ON public.anthropometric_test_sessions
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

-- ============================================
-- ENDURANCE_TEST_SESSIONS - Coaches see their tests
-- ============================================

DROP POLICY IF EXISTS "Coaches can manage their endurance tests" ON public.endurance_test_sessions;
DROP POLICY IF EXISTS "Coaches can view their endurance tests" ON public.endurance_test_sessions;

CREATE POLICY "Coaches can view their endurance tests" ON public.endurance_test_sessions
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert endurance tests" ON public.endurance_test_sessions
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their endurance tests" ON public.endurance_test_sessions
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

-- ============================================
-- TESTS table - Coaches see their tests
-- ============================================

DROP POLICY IF EXISTS "Coaches can view their tests" ON public.tests;
DROP POLICY IF EXISTS "Coaches can manage their tests" ON public.tests;

CREATE POLICY "Coaches can view their tests" ON public.tests
FOR SELECT USING (
  public.can_access_coach_data(coach_id)
);

CREATE POLICY "Coaches can insert tests" ON public.tests
FOR INSERT WITH CHECK (
  public.is_current_user_coach() OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can update their tests" ON public.tests
FOR UPDATE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);

CREATE POLICY "Coaches can delete their tests" ON public.tests
FOR DELETE USING (
  coach_id = public.get_current_app_user_id() 
  OR coach_id IS NULL
  OR public.is_current_user_admin()
);