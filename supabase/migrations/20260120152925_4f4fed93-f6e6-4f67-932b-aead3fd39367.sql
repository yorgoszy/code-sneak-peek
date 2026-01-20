-- Fix coach_course_purchases RLS policies
-- The coach_id references app_users.id, not auth.uid() directly

-- Drop broken policies
DROP POLICY IF EXISTS "Coaches can create their own purchases" ON public.coach_course_purchases;
DROP POLICY IF EXISTS "Coaches can view their own purchases" ON public.coach_course_purchases;
DROP POLICY IF EXISTS "Admins can manage all purchases" ON public.coach_course_purchases;

-- Coaches can INSERT their own purchases (coach_id must match their app_users.id)
CREATE POLICY "Coaches can create their own purchases" ON public.coach_course_purchases
FOR INSERT TO authenticated
WITH CHECK (
  coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

-- Coaches can SELECT their own purchases
CREATE POLICY "Coaches can view their own purchases" ON public.coach_course_purchases
FOR SELECT TO authenticated
USING (
  coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

-- Admins can do everything
CREATE POLICY "Admins can manage all purchases" ON public.coach_course_purchases
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);