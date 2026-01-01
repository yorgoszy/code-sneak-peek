ALTER TABLE public.nutrition_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage assignments for their athletes" ON public.nutrition_assignments;
CREATE POLICY "Coaches can manage assignments for their athletes"
ON public.nutrition_assignments
FOR ALL
TO public
USING (
  public.is_coach_safe(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.app_users u
    WHERE u.id = nutrition_assignments.user_id
      AND u.coach_id = public.get_app_user_id_safe(auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.nutrition_plans p
    WHERE p.id = nutrition_assignments.plan_id
      AND p.coach_id = public.get_app_user_id_safe(auth.uid())
  )
)
WITH CHECK (
  public.is_coach_safe(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.app_users u
    WHERE u.id = nutrition_assignments.user_id
      AND u.coach_id = public.get_app_user_id_safe(auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.nutrition_plans p
    WHERE p.id = nutrition_assignments.plan_id
      AND p.coach_id = public.get_app_user_id_safe(auth.uid())
  )
);
