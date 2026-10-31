DO $$
DECLARE
 v_user uuid;
 v_auth uuid;
 v_order uuid;
 v_plan text;
 v_type uuid;
 v_count integer;
BEGIN
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 SELECT u.id,u.auth_user_id INTO v_user,v_auth FROM public.app_users u
 WHERE u.role='general' AND u.auth_user_id IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=u.auth_user_id AND r.role::text<>'general')
 ORDER BY u.id LIMIT 1 FOR UPDATE;
 IF v_user IS NULL THEN RAISE EXCEPTION 'No eligible account for rollback-only activation tests'; END IF;
 FOREACH v_plan IN ARRAY ARRAY['club','coach','federation'] LOOP
  BEGIN
   INSERT INTO public.thaihub_plan_orders(user_id,plan,amount_cents,stripe_session_id)
   VALUES(v_user,v_plan,CASE v_plan WHEN 'club' THEN 45000 WHEN 'coach' THEN 75000 ELSE 150000 END,'cs_rollback_activation_test') RETURNING id INTO v_order;
   IF (SELECT role FROM public.app_users WHERE id=v_user)<>'general' THEN RAISE EXCEPTION 'Pending purchase granted a role'; END IF;
   PERFORM public.complete_thaihub_plan_purchase(v_order,'cs_rollback_activation_test',CASE v_plan WHEN 'club' THEN 45000 WHEN 'coach' THEN 75000 ELSE 150000 END,'eur');
   IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=v_auth AND role::text=v_plan) THEN RAISE EXCEPTION '% protected role missing',v_plan; END IF;
   IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=v_user AND role=v_plan) THEN RAISE EXCEPTION '% Users tab role missing',v_plan; END IF;
   SELECT id INTO v_type FROM public.subscription_types WHERE coach_id IS NULL AND assigned_role=v_plan ORDER BY created_at,id LIMIT 1;
   SELECT count(*) INTO v_count FROM public.user_subscriptions WHERE user_id=v_user AND subscription_type_id=v_type AND notes='ThaiHub '||v_plan||' online' AND is_paid AND status='active';
   IF v_count<>1 THEN RAISE EXCEPTION '% subscription mismatch',v_plan; END IF;
   PERFORM public.complete_thaihub_plan_purchase(v_order,'cs_rollback_activation_test',CASE v_plan WHEN 'club' THEN 45000 WHEN 'coach' THEN 75000 ELSE 150000 END,'eur');
   IF (SELECT count(*) FROM public.user_subscriptions WHERE user_id=v_user AND subscription_type_id=v_type AND notes='ThaiHub '||v_plan||' online')<>v_count THEN RAISE EXCEPTION 'Duplicate activation'; END IF;
   RAISE EXCEPTION USING ERRCODE='ZZ001',MESSAGE='Rollback successful test';
  EXCEPTION WHEN SQLSTATE 'ZZ001' THEN
   RAISE NOTICE '% activation, matching subscription, Users tab role and idempotency passed; changes rolled back',v_plan;
  END;
 END LOOP;
 IF (SELECT role FROM public.app_users WHERE id=v_user)<>'general' THEN RAISE EXCEPTION 'Test did not restore account'; END IF;
 IF has_function_privilege('authenticated','public.complete_thaihub_plan_purchase(uuid,text,integer,text)','EXECUTE') OR has_function_privilege('anon','public.complete_thaihub_plan_purchase(uuid,text,integer,text)','EXECUTE') THEN RAISE EXCEPTION 'Unverified callers can activate roles'; END IF;
END;
$$;