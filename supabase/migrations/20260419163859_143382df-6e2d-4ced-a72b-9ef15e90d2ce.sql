CREATE POLICY "app_users_insert_federation_new_coach"
ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'coach'
  AND EXISTS (
    SELECT 1 FROM public.app_users fed
    WHERE fed.auth_user_id = auth.uid()
      AND fed.role = 'federation'
  )
);