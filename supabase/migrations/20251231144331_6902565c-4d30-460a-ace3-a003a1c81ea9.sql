-- Add RLS policies for coaches to manage their own subscription types
CREATE POLICY "Coaches can insert their own subscription types"
ON public.subscription_types
FOR INSERT
WITH CHECK (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update their own subscription types"
ON public.subscription_types
FOR UPDATE
USING (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete their own subscription types"
ON public.subscription_types
FOR DELETE
USING (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view their own subscription types"
ON public.subscription_types
FOR SELECT
USING (
  coach_id IN (
    SELECT id FROM app_users WHERE auth_user_id = auth.uid()
  )
);