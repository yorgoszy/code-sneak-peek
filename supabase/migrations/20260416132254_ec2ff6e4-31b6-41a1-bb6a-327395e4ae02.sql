
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'health-cards';

-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Anyone can view health card images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload health card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own health card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own health card images" ON storage.objects;

-- SELECT: user themselves, their coach, or federation
CREATE POLICY "Health cards viewable by owner coach or federation"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'health-cards'
  AND (
    -- Coach/admin can view all
    public.is_coach_user(auth.uid())
    OR
    -- User can view their own (folder-based: {app_user_id}/...)
    EXISTS (
      SELECT 1 FROM public.app_users au
      WHERE au.auth_user_id = auth.uid()
        AND split_part(name, '/', 1) = au.id::text
    )
  )
);

-- INSERT: only coaches/admins
CREATE POLICY "Coaches can upload health card images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'health-cards'
  AND public.is_coach_user(auth.uid())
);

-- UPDATE: only coaches/admins
CREATE POLICY "Coaches can update health card images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'health-cards'
  AND public.is_coach_user(auth.uid())
)
WITH CHECK (
  bucket_id = 'health-cards'
  AND public.is_coach_user(auth.uid())
);

-- DELETE: only coaches/admins
CREATE POLICY "Coaches can delete health card images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'health-cards'
  AND public.is_coach_user(auth.uid())
);
