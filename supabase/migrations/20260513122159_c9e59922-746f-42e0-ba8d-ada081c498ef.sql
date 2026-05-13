CREATE POLICY "Temp anon upload branding"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'branding');