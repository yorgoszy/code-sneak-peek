CREATE POLICY "Public read promo-video"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'promo-video');

CREATE POLICY "Admins upload promo-video"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'promo-video' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update promo-video"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'promo-video' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete promo-video"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'promo-video' AND public.has_role(auth.uid(), 'admin'));