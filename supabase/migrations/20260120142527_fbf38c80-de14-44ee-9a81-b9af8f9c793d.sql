-- Fix RLS policy for admins to insert/update courses
-- First drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.knowledge_courses;

-- Create a more explicit policy for admins
CREATE POLICY "Admins can manage all courses"
ON public.knowledge_courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

-- Create storage bucket for course PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-pdfs', 'course-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course PDFs
CREATE POLICY "Admins can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Everyone can view course PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'course-pdfs');