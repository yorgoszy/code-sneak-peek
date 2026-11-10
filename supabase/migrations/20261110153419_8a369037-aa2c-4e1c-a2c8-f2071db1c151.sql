ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS section_schedule jsonb;
CREATE OR REPLACE FUNCTION public.save_admin_section_assignment(p_user_id uuid,p_section_id uuid,p_schedule jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE u public.app_users%ROWTYPE; s public.booking_sections%ROWTYPE; start_on date; end_on date; today date := (now() AT TIME ZONE 'Europe/Athens')::date; item record; slot text; day_name text; created integer := 0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Δεν έχεις δικαίωμα ανάθεσης τμήματος'; END IF;
 SELECT * INTO u FROM public.app_users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ο χρήστης δεν βρέθηκε'; END IF;
 IF u.coach_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.app_users owner JOIN public.user_roles r ON r.user_id=owner.auth_user_id AND r.role='admin' WHERE owner.id=u.coach_id) THEN RAISE EXCEPTION 'Ανάθεση μόνο για χρήστες του admin'; END IF;
 IF p_section_id IS NOT NULL THEN
  SELECT * INTO s FROM public.booking_sections WHERE id=p_section_id AND coach_id IS NULL AND is_active AND booking_type='gym_visit' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Το τμήμα δεν είναι διαθέσιμο στο ημερολόγιο του admin'; END IF;
  SELECT greatest(today,start_date),end_date INTO start_on,end_on FROM public.user_subscriptions WHERE user_id=p_user_id AND coach_id IS NULL AND status='active' AND NOT coalesce(is_paused,false) AND end_date>=today ORDER BY end_date DESC LIMIT 1;
  IF end_on IS NULL THEN RAISE EXCEPTION 'Ο χρήστης δεν έχει ενεργή συνδρομή'; END IF;
  IF p_schedule IS NULL OR jsonb_typeof(p_schedule)<>'object' THEN RAISE EXCEPTION 'Επιλέξτε ημέρα και ώρα'; END IF;
  FOR item IN SELECT key,value FROM jsonb_each(p_schedule) LOOP
   IF item.key NOT IN('monday','tuesday','wednesday','thursday','friday','saturday','sunday') OR jsonb_typeof(item.value)<>'array' THEN RAISE EXCEPTION 'Μη έγκυρη επιλογή ημέρας'; END IF;
   FOR slot IN SELECT value FROM jsonb_array_elements_text(item.value) LOOP
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(s.available_hours->item.key,'[]'::jsonb)) h WHERE left(h.value,5)=slot) THEN RAISE EXCEPTION 'Η επιλεγμένη ώρα δεν υπάρχει στο τμήμα'; END IF;
    created:=created+1;
   END LOOP;
  END LOOP;
  IF created=0 THEN RAISE EXCEPTION 'Επιλέξτε τουλάχιστον μία ημέρα και ώρα'; END IF;
 END IF;
 DELETE FROM public.booking_sessions WHERE user_id=p_user_id AND coach_id IS NULL AND booking_type='gym_visit' AND status IN('confirmed','pending') AND booking_date>=today;
 UPDATE public.app_users SET section_id=p_section_id,section_schedule=CASE WHEN p_section_id IS NULL THEN '{}'::jsonb ELSE p_schedule END WHERE id=p_user_id;
 created:=0;
 IF p_section_id IS NOT NULL THEN
  INSERT INTO public.booking_sessions(user_id,section_id,booking_date,booking_time,booking_type,status,coach_id)
  SELECT p_user_id,p_section_id,d::date,slots.slot::time,'gym_visit','confirmed',NULL
  FROM generate_series(start_on::timestamp,end_on::timestamp,interval '1 day') d
  CROSS JOIN LATERAL (SELECT CASE extract(isodow FROM d)::int WHEN 1 THEN 'monday' WHEN 2 THEN 'tuesday' WHEN 3 THEN 'wednesday' WHEN 4 THEN 'thursday' WHEN 5 THEN 'friday' WHEN 6 THEN 'saturday' ELSE 'sunday' END AS name) days
  CROSS JOIN LATERAL (SELECT DISTINCT value AS slot FROM jsonb_array_elements_text(coalesce(p_schedule->days.name,'[]'::jsonb))) slots
  WHERE NOT EXISTS(SELECT 1 FROM public.booking_sessions b WHERE b.user_id=p_user_id AND b.section_id=p_section_id AND b.booking_date=d::date AND b.booking_time=slots.slot::time AND b.status='completed');
  GET DIAGNOSTICS created=ROW_COUNT;
 END IF;
 RETURN created;
END; $$;
REVOKE ALL ON FUNCTION public.save_admin_section_assignment(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_admin_section_assignment(uuid,uuid,jsonb) TO authenticated;
