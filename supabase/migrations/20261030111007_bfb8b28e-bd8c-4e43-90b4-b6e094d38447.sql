DROP POLICY IF EXISTS "Public Access to Athlete Photos" ON storage.objects;
DROP POLICY IF EXISTS "Insert Athlete Photos" ON storage.objects;
DROP POLICY IF EXISTS "Update Own Athlete Photos" ON storage.objects;
DROP POLICY IF EXISTS "Delete Own Athlete Photos" ON storage.objects;
CREATE POLICY "Athlete photos own read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='athlete_photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Athlete photos own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='athlete_photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Athlete photos own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='athlete_photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Athlete photos own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='athlete_photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Public read promo-video" ON storage.objects;
CREATE POLICY "Admins read promo-video" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='promo-video' AND public.has_role(auth.uid(),'admin'::user_role));

DROP POLICY IF EXISTS "Anyone can read by id" ON public.trial_requests;
CREATE POLICY "Admins or owner read trial requests" ON public.trial_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'::user_role) OR lower(email) = lower(auth.jwt()->>'email'));

CREATE OR REPLACE FUNCTION public.get_trial_request_status(p_id uuid)
RETURNS TABLE(status text, admin_response text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT status::text, admin_response::text FROM public.trial_requests WHERE id = p_id
$$;
GRANT EXECUTE ON FUNCTION public.get_trial_request_status(uuid) TO anon, authenticated;