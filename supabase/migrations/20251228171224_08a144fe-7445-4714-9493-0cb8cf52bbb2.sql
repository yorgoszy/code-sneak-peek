-- Add RLS policy for coaches to see only their assigned users
CREATE POLICY "app_users_select_coach_assigned_users" ON public.app_users
FOR SELECT
USING (
  -- Coach can see users where they are the coach
  coach_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'coach'
  )
);

-- Add RLS policy for coaches to update their assigned users
CREATE POLICY "app_users_update_coach_assigned_users" ON public.app_users
FOR UPDATE
USING (
  coach_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'coach'
  )
)
WITH CHECK (
  coach_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'coach'
  )
);

-- Add RLS policy for coaches to insert new users (assigned to themselves)
CREATE POLICY "app_users_insert_coach_new_users" ON public.app_users
FOR INSERT
WITH CHECK (
  coach_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'coach'
  )
);