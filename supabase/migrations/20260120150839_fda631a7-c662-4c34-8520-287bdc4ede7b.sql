-- Drop the broken INSERT policy and recreate with proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins can upload PDFs" ON storage.objects;

CREATE POLICY "Admins can upload PDFs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-pdfs' AND
  EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- Also add a SELECT policy so PDFs can be viewed publicly
DROP POLICY IF EXISTS "Anyone can view course PDFs" ON storage.objects;

CREATE POLICY "Anyone can view course PDFs" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'course-pdfs');