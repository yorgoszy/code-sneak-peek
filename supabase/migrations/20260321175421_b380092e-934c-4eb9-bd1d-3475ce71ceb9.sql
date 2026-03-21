-- Fix course_questions: replace public-role policies with authenticated
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.course_questions;
CREATE POLICY "Admins can manage all questions"
  ON public.course_questions FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Coaches can create questions" ON public.course_questions;
CREATE POLICY "Coaches can create questions"
  ON public.course_questions FOR INSERT TO authenticated
  WITH CHECK (coach_id = public.get_app_user_id_for_programs(auth.uid()));

DROP POLICY IF EXISTS "Coaches can view their own questions" ON public.course_questions;
CREATE POLICY "Coaches can view their own questions"
  ON public.course_questions FOR SELECT TO authenticated
  USING (coach_id = public.get_app_user_id_for_programs(auth.uid()));

-- Also fix remaining public-role policies on program_purchases
DROP POLICY IF EXISTS "Admins can manage all purchases" ON public.program_purchases;
CREATE POLICY "Admins can manage all purchases"
  ON public.program_purchases FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Coaches can view purchases of their programs" ON public.program_purchases;
CREATE POLICY "Coaches can view purchases of their programs"
  ON public.program_purchases FOR SELECT TO authenticated
  USING (coach_id = public.get_app_user_id_for_programs(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own purchases" ON public.program_purchases;
CREATE POLICY "Users can view their own purchases"
  ON public.program_purchases FOR SELECT TO authenticated
  USING (user_id = public.get_app_user_id_for_programs(auth.uid()));