-- Add video_file_path column for storage reference
ALTER TABLE knowledge_courses 
ADD COLUMN IF NOT EXISTS video_file_path TEXT;

-- Drop the problematic policy and recreate with correct logic
DROP POLICY IF EXISTS "Purchasers can view course videos" ON storage.objects;

-- RLS policy: Allow coaches who purchased the course to view videos
-- Uses video_file_path to match with storage object name
CREATE POLICY "Purchasers can view course videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-videos' 
  AND (
    -- Admins can always view
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Coaches who purchased can view
    EXISTS (
      SELECT 1 
      FROM coach_course_purchases ccp
      JOIN app_users au ON au.id = ccp.coach_id
      JOIN knowledge_courses kc ON kc.id = ccp.course_id
      WHERE au.auth_user_id = auth.uid()
      AND ccp.status = 'completed'
      AND kc.video_file_path IS NOT NULL
      AND storage.objects.name LIKE '%' || SPLIT_PART(kc.video_file_path, '/', -1)
    )
  )
);