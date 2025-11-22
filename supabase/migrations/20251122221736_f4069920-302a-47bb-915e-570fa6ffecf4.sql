-- Δημιουργία storage bucket για φωτογραφίες προφίλ
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos', 
  'profile-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Όλοι μπορούν να βλέπουν τις φωτογραφίες (public bucket)
CREATE POLICY "Public Access for profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- RLS Policy: Οι χρήστες μπορούν να ανεβάζουν τις δικές τους φωτογραφίες
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Οι χρήστες μπορούν να ενημερώνουν τις δικές τους φωτογραφίες
CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Οι χρήστες μπορούν να διαγράφουν τις δικές τους φωτογραφίες
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);