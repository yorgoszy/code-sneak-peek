-- Create course-thumbnails bucket for storing video thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-thumbnails', 'course-thumbnails', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can view thumbnails (public bucket)
CREATE POLICY "Public can view course thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- RLS: Admins can upload thumbnails
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- RLS: Admins can update thumbnails
CREATE POLICY "Admins can update course thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-thumbnails' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- RLS: Admins can delete thumbnails
CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'course-thumbnails' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);