
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own user photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own user photos" ON storage.objects;

-- Recreate with ownership checks
CREATE POLICY "Allow authenticated uploads to own folder in user-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update their own user photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own user photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
