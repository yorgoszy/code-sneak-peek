ALTER TABLE public.user_visits ADD COLUMN section_id uuid REFERENCES public.booking_sections(id) ON DELETE SET NULL, ADD COLUMN package_id uuid REFERENCES public.visit_packages(id) ON DELETE SET NULL;
CREATE INDEX user_visits_section_calendar ON public.user_visits(user_id,section_id,visit_date);
CREATE OR REPLACE FUNCTION public.record_section_visit(p_user_id uuid,p_section_id uuid,p_package_id uuid DEFAULT NULL,p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_id uuid; pkg public.visit_packages%ROWTYPE; sections uuid[];
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin'::public.user_role) THEN RAISE EXCEPTION 'Δεν επιτρέπεται η καταγραφή παρουσίας'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.booking_sections WHERE id=p_section_id AND is_active=true) THEN RAISE EXCEPTION 'Επιλέξτε ενεργό τμήμα'; END IF;
 IF p_package_id IS NOT NULL THEN
  SELECT * INTO pkg FROM public.visit_packages WHERE id=p_package_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR pkg.status<>'active' OR pkg.remaining_visits<=0 OR pkg.expiry_date<CURRENT_DATE THEN RAISE EXCEPTION 'Μη διαθέσιμο πακέτο επισκέψεων'; END IF;
 ELSE
  SELECT * INTO pkg FROM public.visit_packages WHERE user_id=p_user_id AND status='active' AND remaining_visits>0 AND (expiry_date IS NULL OR expiry_date>=CURRENT_DATE)
  AND (COALESCE(cardinality(allowed_sections),0)=0 OR p_section_id=ANY(allowed_sections)) ORDER BY purchase_date DESC,id LIMIT 1 FOR UPDATE;
 END IF;
 IF pkg.id IS NOT NULL THEN
  SELECT st.allowed_sections INTO sections FROM public.user_subscriptions us JOIN public.subscription_types st ON st.id=us.subscription_type_id WHERE us.id=pkg.subscription_id AND us.user_id=p_user_id;
  IF NOT FOUND THEN sections:=pkg.allowed_sections; END IF;
  IF COALESCE(cardinality(sections),0)>0 AND NOT(p_section_id=ANY(sections)) THEN RAISE EXCEPTION 'Το πακέτο δεν επιτρέπει αυτό το τμήμα'; END IF;
 END IF;
 INSERT INTO public.user_visits(user_id,section_id,package_id,visit_type,notes,created_by)
 VALUES(p_user_id,p_section_id,pkg.id,CASE WHEN p_package_id IS NULL THEN 'manual' ELSE 'package' END,p_notes,public.current_app_user_id()) RETURNING id INTO v_id;
 IF pkg.id IS NOT NULL THEN
 UPDATE public.visit_packages SET remaining_visits=remaining_visits-1,status=CASE WHEN remaining_visits=1 THEN 'used' ELSE 'active' END,updated_at=now() WHERE id=pkg.id;
 END IF;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.record_section_visit(uuid,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_section_visit(uuid,uuid,uuid,text) TO authenticated;
GRANT ALL ON FUNCTION public.record_section_visit(uuid,uuid,uuid,text) TO service_role;