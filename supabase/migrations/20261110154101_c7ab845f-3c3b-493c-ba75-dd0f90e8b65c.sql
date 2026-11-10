CREATE OR REPLACE FUNCTION public.section_attendance_slots(p_schedule jsonb, p_start date, p_end date)
RETURNS TABLE(booking_date date, booking_time time)
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=public AS $$
 SELECT DISTINCT d::date, slot.value::time
 FROM generate_series(p_start::timestamp,p_end::timestamp,interval '1 day') d
 CROSS JOIN LATERAL (SELECT CASE extract(isodow FROM d)::int WHEN 1 THEN 'monday' WHEN 2 THEN 'tuesday' WHEN 3 THEN 'wednesday' WHEN 4 THEN 'thursday' WHEN 5 THEN 'friday' WHEN 6 THEN 'saturday' ELSE 'sunday' END AS name) days
 CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(p_schedule->days.name,'[]'::jsonb)) slot
$$;
REVOKE ALL ON FUNCTION public.section_attendance_slots(jsonb,date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.section_attendance_slots(jsonb,date,date) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.renew_subscription(original_subscription_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE original_sub public.user_subscriptions%ROWTYPE; u public.app_users%ROWTYPE; s public.booking_sections%ROWTYPE; new_start_date date; new_end_date date; new_subscription_id uuid; months integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Δεν έχεις δικαίωμα ανανέωσης συνδρομής'; END IF;
 SELECT * INTO original_sub FROM public.user_subscriptions WHERE id=original_subscription_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Η συνδρομή δεν βρέθηκε'; END IF;
 SELECT * INTO u FROM public.app_users WHERE id=original_sub.user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ο χρήστης δεν βρέθηκε'; END IF;
 SELECT duration_months INTO months FROM public.subscription_types WHERE id=original_sub.subscription_type_id;
 new_start_date := original_sub.end_date + 1;
 new_end_date := (new_start_date + interval '1 month' * months - interval '1 day')::date;
 INSERT INTO public.user_subscriptions(user_id,subscription_type_id,start_date,end_date,status,coach_id)
 VALUES(original_sub.user_id,original_sub.subscription_type_id,new_start_date,new_end_date,'active',original_sub.coach_id)
 RETURNING id INTO new_subscription_id;
 UPDATE public.app_users SET subscription_status='active' WHERE id=original_sub.user_id;
 IF original_sub.coach_id IS NULL AND u.section_id IS NOT NULL AND jsonb_typeof(u.section_schedule)='object' AND u.section_schedule<>'{}'::jsonb THEN
  SELECT * INTO s FROM public.booking_sections WHERE id=u.section_id AND coach_id IS NULL AND is_active AND (booking_type IS NULL OR booking_type='gym_visit');
  IF FOUND THEN
   INSERT INTO public.booking_sessions(user_id,section_id,booking_date,booking_time,booking_type,status,coach_id)
   SELECT u.id,s.id,slots.booking_date,slots.booking_time,'gym_visit','confirmed',NULL
   FROM public.section_attendance_slots(u.section_schedule,greatest(new_start_date,(now() AT TIME ZONE 'Europe/Athens')::date),new_end_date) slots
   WHERE EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(s.available_hours->CASE extract(isodow FROM slots.booking_date)::int WHEN 1 THEN 'monday' WHEN 2 THEN 'tuesday' WHEN 3 THEN 'wednesday' WHEN 4 THEN 'thursday' WHEN 5 THEN 'friday' WHEN 6 THEN 'saturday' ELSE 'sunday' END,'[]'::jsonb)) h WHERE h.value::time=slots.booking_time)
   AND NOT EXISTS(SELECT 1 FROM public.booking_sessions b WHERE b.user_id=u.id AND b.section_id=s.id AND b.coach_id IS NULL AND b.booking_date=slots.booking_date AND b.booking_time=slots.booking_time AND b.status IN('pending','confirmed','completed'));
  END IF;
 END IF;
 RETURN new_subscription_id;
END; $$;
REVOKE ALL ON FUNCTION public.renew_subscription(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.renew_subscription(uuid) TO authenticated;