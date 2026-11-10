-- Run against the connected database; tests the function used by renew_subscription.
WITH actual AS (
  SELECT booking_date::text AS day, to_char(booking_time, 'HH24:MI') AS time
  FROM public.section_attendance_slots(
    '{"monday":["19:00"],"wednesday":["19:00"],"friday":["19:00"]}'::jsonb,
    '2026-12-14'::date, '2026-12-20'::date
  )
), expected(day,time) AS (
  VALUES ('2026-12-14','19:00'), ('2026-12-16','19:00'), ('2026-12-18','19:00')
)
SELECT NOT EXISTS(SELECT * FROM actual EXCEPT SELECT * FROM expected)
  AND NOT EXISTS(SELECT * FROM expected EXCEPT SELECT * FROM actual)
  AS same_weekdays_and_times_on_renewal;

SELECT count(*)=0 AS empty_assignment_generates_no_bookings
FROM public.section_attendance_slots('{}'::jsonb,'2026-12-14'::date,'2026-12-20'::date);

SELECT count(*)=1 AND min(booking_date)='2026-12-16'::date AS stays_within_renewal_period
FROM public.section_attendance_slots('{"monday":["19:00"],"wednesday":["19:00"],"friday":["19:00"]}'::jsonb,'2026-12-15'::date,'2026-12-17'::date);