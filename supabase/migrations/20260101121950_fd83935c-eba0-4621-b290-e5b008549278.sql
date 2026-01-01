-- Enable RLS (if not already)
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_meal_foods ENABLE ROW LEVEL SECURITY;

-- COACH policies for nutrition_plans
DROP POLICY IF EXISTS "Coaches can manage their own nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Coaches can manage their own nutrition plans"
ON public.nutrition_plans
FOR ALL
TO public
USING (
  public.is_coach_safe(auth.uid())
  AND coach_id = public.get_app_user_id_safe(auth.uid())
)
WITH CHECK (
  public.is_coach_safe(auth.uid())
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);

-- COACH policies for nutrition_plan_days
DROP POLICY IF EXISTS "Coaches can manage their own nutrition plan days" ON public.nutrition_plan_days;
CREATE POLICY "Coaches can manage their own nutrition plan days"
ON public.nutrition_plan_days
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.nutrition_plans np
    WHERE np.id = nutrition_plan_days.plan_id
      AND public.is_coach_safe(auth.uid())
      AND np.coach_id = public.get_app_user_id_safe(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.nutrition_plans np
    WHERE np.id = nutrition_plan_days.plan_id
      AND public.is_coach_safe(auth.uid())
      AND np.coach_id = public.get_app_user_id_safe(auth.uid())
  )
);

-- COACH policies for nutrition_meals
DROP POLICY IF EXISTS "Coaches can manage their own nutrition meals" ON public.nutrition_meals;
CREATE POLICY "Coaches can manage their own nutrition meals"
ON public.nutrition_meals
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.nutrition_plan_days d
    JOIN public.nutrition_plans p ON p.id = d.plan_id
    WHERE d.id = nutrition_meals.day_id
      AND public.is_coach_safe(auth.uid())
      AND p.coach_id = public.get_app_user_id_safe(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.nutrition_plan_days d
    JOIN public.nutrition_plans p ON p.id = d.plan_id
    WHERE d.id = nutrition_meals.day_id
      AND public.is_coach_safe(auth.uid())
      AND p.coach_id = public.get_app_user_id_safe(auth.uid())
  )
);

-- COACH policies for nutrition_meal_foods
DROP POLICY IF EXISTS "Coaches can manage their own nutrition meal foods" ON public.nutrition_meal_foods;
CREATE POLICY "Coaches can manage their own nutrition meal foods"
ON public.nutrition_meal_foods
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.nutrition_meals m
    JOIN public.nutrition_plan_days d ON d.id = m.day_id
    JOIN public.nutrition_plans p ON p.id = d.plan_id
    WHERE m.id = nutrition_meal_foods.meal_id
      AND public.is_coach_safe(auth.uid())
      AND p.coach_id = public.get_app_user_id_safe(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.nutrition_meals m
    JOIN public.nutrition_plan_days d ON d.id = m.day_id
    JOIN public.nutrition_plans p ON p.id = d.plan_id
    WHERE m.id = nutrition_meal_foods.meal_id
      AND public.is_coach_safe(auth.uid())
      AND p.coach_id = public.get_app_user_id_safe(auth.uid())
  )
);
