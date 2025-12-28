-- Δημιουργία storage bucket για φωτογραφίες coach users
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-user-avatars', 'coach-user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies για το bucket
CREATE POLICY "Coaches can upload avatars for their users"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'coach-user-avatars' AND
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('coach', 'admin')
  )
);

CREATE POLICY "Coaches can update avatars for their users"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'coach-user-avatars' AND
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('coach', 'admin')
  )
);

CREATE POLICY "Coaches can delete avatars for their users"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'coach-user-avatars' AND
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('coach', 'admin')
  )
);

CREATE POLICY "Anyone can view coach user avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'coach-user-avatars');