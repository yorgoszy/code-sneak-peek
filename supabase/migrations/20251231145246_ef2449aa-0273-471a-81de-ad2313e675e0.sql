-- Add RLS policies for coaches to manage their own expenses
CREATE POLICY "Coaches can insert their own expenses"
ON public.expenses
FOR INSERT
WITH CHECK (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update their own expenses"
ON public.expenses
FOR UPDATE
USING (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete their own expenses"
ON public.expenses
FOR DELETE
USING (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view their own expenses"
ON public.expenses
FOR SELECT
USING (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);