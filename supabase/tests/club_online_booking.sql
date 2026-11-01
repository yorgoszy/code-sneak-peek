-- Read-only permission regression checks; each result must be true.
SELECT 'Club can manage its own gym sections only' AS rule,
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_sections'
    AND policyname='Clubs manage own gym sections' AND cmd='ALL'
    AND qual LIKE '%current_app_user_id()%'
    AND qual LIKE '%club%'
    AND qual LIKE '%gym_visit%'
    AND with_check = qual) AS passed;
SELECT 'Club can manage only its own users gym appointments' AS rule,
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_sessions'
    AND policyname='Clubs manage own gym appointments' AND cmd='ALL'
    AND qual LIKE '%current_app_user_id()%'
    AND qual LIKE '%gym_visit%'
    AND qual LIKE '%can_manage_club_booking_user(user_id)%'
    AND with_check = qual) AS passed;
SELECT 'Club ownership check is not elevated and verifies protected role and ownership' AS rule,
  EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace
    AND proname='can_manage_club_booking_user' AND NOT prosecdef
    AND prosrc LIKE '%has_role(auth.uid(),''club'')%'
    AND prosrc LIKE '%owns_coaching_user(p_user,public.current_app_user_id())%') AS passed;