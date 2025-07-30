-- Προσθήκη πεδίων στον πίνακα app_users για πλήρη προφίλ
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Δημιουργία storage bucket για avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies για avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text IN (
    SELECT au.auth_user_id::text 
    FROM public.app_users au 
    WHERE au.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text IN (
    SELECT au.auth_user_id::text 
    FROM public.app_users au 
    WHERE au.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text IN (
    SELECT au.auth_user_id::text 
    FROM public.app_users au 
    WHERE au.id::text = (storage.foldername(name))[1]
  )
);