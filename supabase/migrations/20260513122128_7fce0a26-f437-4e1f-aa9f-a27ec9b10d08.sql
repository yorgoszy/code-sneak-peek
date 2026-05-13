INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read branding"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

CREATE POLICY "Admins write branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding' AND public.is_current_user_admin());

CREATE POLICY "Admins update branding"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branding' AND public.is_current_user_admin());

CREATE POLICY "Admins delete branding"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branding' AND public.is_current_user_admin());