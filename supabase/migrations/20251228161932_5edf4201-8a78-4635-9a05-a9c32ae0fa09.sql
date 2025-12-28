-- ============================================
-- COACH MULTI-TENANT SYSTEM
-- ============================================

-- 1. Add coach_id to app_users table (links users to their coach)
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 2. Add coach_id to exercises table (for private exercises)
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 3. Add coach_id to programs table  
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 4. Add coach_id to program_assignments table
ALTER TABLE public.program_assignments 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 5. Add coach_id to tests table
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 6. Add coach_id to receipts table (for subscriptions/payments)
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 7. Add coach_id to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 8. Add coach_id to nutrition_plans table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nutrition_plans') THEN
    ALTER TABLE public.nutrition_plans 
    ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 9. Add coach_id to annual_planning table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'annual_planning') THEN
    ALTER TABLE public.annual_planning 
    ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 10. Add coach_id to groups/teams table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups') THEN
    ALTER TABLE public.groups 
    ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 11. Add coach_id to strength_test_sessions
ALTER TABLE public.strength_test_sessions 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 12. Add coach_id to anthropometric_test_sessions
ALTER TABLE public.anthropometric_test_sessions 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 13. Add coach_id to endurance_test_sessions
ALTER TABLE public.endurance_test_sessions 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

-- ============================================
-- HELPER FUNCTION: Get current user's coach_id or user_id if admin/coach
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_user_coach_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_coach_id UUID;
BEGIN
  -- Get the app_user record for the current auth user
  SELECT id, role, coach_id 
  INTO v_user_id, v_role, v_coach_id
  FROM public.app_users 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  -- If admin, return NULL (sees everything)
  IF v_role = 'admin' THEN
    RETURN NULL;
  END IF;
  
  -- If coach, return their own ID
  IF v_role = 'coach' THEN
    RETURN v_user_id;
  END IF;
  
  -- Otherwise return the coach_id (for athletes/parents)
  RETURN v_coach_id;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- ============================================
-- HELPER FUNCTION: Check if current user is coach
-- ============================================
CREATE OR REPLACE FUNCTION public.is_current_user_coach()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'coach'
  );
END;
$$;

-- ============================================
-- HELPER FUNCTION: Get current app_user id
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- ============================================
-- Create indexes for coach_id columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_app_users_coach_id ON public.app_users(coach_id);
CREATE INDEX IF NOT EXISTS idx_exercises_coach_id ON public.exercises(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON public.programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_coach_id ON public.program_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_tests_coach_id ON public.tests(coach_id);
CREATE INDEX IF NOT EXISTS idx_receipts_coach_id ON public.receipts(coach_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_coach_id ON public.user_subscriptions(coach_id);
CREATE INDEX IF NOT EXISTS idx_strength_test_sessions_coach_id ON public.strength_test_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_anthropometric_test_sessions_coach_id ON public.anthropometric_test_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_endurance_test_sessions_coach_id ON public.endurance_test_sessions(coach_id);