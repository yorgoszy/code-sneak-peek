DO $test$
DECLARE passed boolean;
BEGIN
 WITH actual AS (SELECT booking_date::text AS day,to_char(booking_time,'HH24:MI') AS time FROM public.section_attendance_slots('{"monday":["19:00"],"wednesday":["19:00"],"friday":["19:00"]}'::jsonb,'2026-12-14'::date,'2026-12-20'::date)),expected(day,time) AS (VALUES ('2026-12-14','19:00'),('2026-12-16','19:00'),('2026-12-18','19:00')) SELECT NOT EXISTS(SELECT * FROM actual EXCEPT SELECT * FROM expected) AND NOT EXISTS(SELECT * FROM expected EXCEPT SELECT * FROM actual) INTO passed;
 IF NOT passed THEN RAISE EXCEPTION 'Renewal did not preserve weekdays and times'; END IF;
 SELECT count(*)=0 INTO passed FROM public.section_attendance_slots('{}'::jsonb,'2026-12-14'::date,'2026-12-20'::date);
 IF NOT passed THEN RAISE EXCEPTION 'Empty assignment generated slots'; END IF;
 SELECT count(*)=1 AND min(booking_date)='2026-12-16'::date INTO passed FROM public.section_attendance_slots('{"monday":["19:00"],"wednesday":["19:00"],"friday":["19:00"]}'::jsonb,'2026-12-15'::date,'2026-12-17'::date);
 IF NOT passed THEN RAISE EXCEPTION 'Renewal slots escaped subscription period'; END IF;
END;
$test$;