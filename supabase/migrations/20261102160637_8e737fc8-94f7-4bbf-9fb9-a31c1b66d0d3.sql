DO $$
DECLARE
  target_user uuid := '0d6381b6-03bc-4b2b-a64b-918d2de96a0e';
  target_coach uuid := '371d1bb6-ee37-4824-8a64-50a21013f7e3';
  target_auth uuid;
  scope_coach uuid;
  managed boolean;
  visible_count integer;
BEGIN
  SELECT auth_user_id INTO target_auth FROM public.app_users WHERE id=target_user;
  IF target_auth IS NULL THEN RAISE EXCEPTION 'Test user must have an Auth account'; END IF;
  PERFORM set_config('request.jwt.claim.sub', target_auth::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  SELECT coach_id,is_coach_managed INTO scope_coach,managed FROM public.get_user_subscription_scope(target_user);
  IF scope_coach IS DISTINCT FROM target_coach OR managed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Club-owned user must resolve to coach subscription scope';
  END IF;
  SELECT count(*) INTO visible_count FROM public.coach_subscriptions
  WHERE id='a69d1162-678f-4bd6-9389-9d81b09fd849' AND user_id=target_user AND coach_id=target_coach AND status='active' AND end_date='2026-11-30';
  IF visible_count <> 1 THEN RAISE EXCEPTION 'User must read their saved coach subscription through RLS'; END IF;
  SELECT count(*) INTO visible_count FROM public.coach_subscriptions WHERE user_id<>target_user;
  IF visible_count <> 0 THEN RAISE EXCEPTION 'User must not read other recipients subscriptions'; END IF;
  SELECT count(*) INTO visible_count FROM public.get_user_subscription_scope(target_coach);
  IF visible_count <> 0 THEN RAISE EXCEPTION 'User must not resolve another profile scope'; END IF;
  RESET ROLE;
END $$;