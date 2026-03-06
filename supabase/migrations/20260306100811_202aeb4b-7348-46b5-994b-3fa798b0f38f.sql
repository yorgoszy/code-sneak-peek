CREATE POLICY "app_users_select_federation_coaches"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  get_user_role_safe(auth.uid()) = 'federation'
  AND role = 'coach'
);