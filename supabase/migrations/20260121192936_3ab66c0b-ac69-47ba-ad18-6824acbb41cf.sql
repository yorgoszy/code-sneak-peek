-- Create course-videos bucket for secure video storage
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-videos', 'course-videos', false, 5368709120)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 5368709120;

-- RLS: Admins can upload videos
CREATE POLICY "Admins can upload course videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-videos' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- RLS: Admins can update videos
CREATE POLICY "Admins can update course videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-videos' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- RLS: Admins can delete videos
CREATE POLICY "Admins can delete course videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'course-videos' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);