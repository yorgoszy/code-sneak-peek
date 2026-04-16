
-- Drop old permissive INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can upload competition regulations" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own competition regulations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own competition regulations" ON storage.objects;

-- INSERT: only federation/admin
CREATE POLICY "Federation/admin can upload competition regulations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'competition-regulations'
  AND EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('federation', 'admin')
  )
);

-- UPDATE: only federation/admin
CREATE POLICY "Federation/admin can update competition regulations"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'competition-regulations'
  AND EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('federation', 'admin')
  )
)
WITH CHECK (
  bucket_id = 'competition-regulations'
  AND EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('federation', 'admin')
  )
);

-- DELETE: only federation/admin
CREATE POLICY "Federation/admin can delete competition regulations"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'competition-regulations'
  AND EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('federation', 'admin')
  )
);
