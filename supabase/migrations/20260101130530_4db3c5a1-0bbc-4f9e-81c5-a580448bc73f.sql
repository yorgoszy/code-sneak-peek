-- Fix infinite recursion in RLS between nutrition_plans <-> nutrition_assignments
-- by removing policy subquery on nutrition_plans and replacing it with a SECURITY DEFINER lookup.

CREATE OR REPLACE FUNCTION public.get_nutrition_plan_coach_id_safe(p_plan_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coach_id
  FROM public.nutrition_plans
  WHERE id = p_plan_id
  LIMIT 1;
$$;

-- Recreate the coach policy on nutrition_assignments without referencing nutrition_plans via RLS
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
    WHERE u.id = public.nutrition_assignments.user_id
      AND u.coach_id = public.get_app_user_id_safe(auth.uid())
  )
  AND public.get_nutrition_plan_coach_id_safe(public.nutrition_assignments.plan_id) = public.get_app_user_id_safe(auth.uid())
)
WITH CHECK (
  public.is_coach_safe(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.app_users u
    WHERE u.id = public.nutrition_assignments.user_id
      AND u.coach_id = public.get_app_user_id_safe(auth.uid())
  )
  AND public.get_nutrition_plan_coach_id_safe(public.nutrition_assignments.plan_id) = public.get_app_user_id_safe(auth.uid())
);
