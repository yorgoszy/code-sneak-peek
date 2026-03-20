-- Fix 1: Drop overly permissive SELECT policy on user_subscriptions
DROP POLICY IF EXISTS "Everyone can view active subscriptions" ON public.user_subscriptions;

-- Fix 2: Drop public upload policy on storage.objects and require authentication
DROP POLICY IF EXISTS "Public insert to uploads" ON storage.objects;
CREATE POLICY "Authenticated users can upload to uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
);