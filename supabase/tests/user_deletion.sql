DO $$
DECLARE target uuid := gen_random_uuid(); other_user uuid := gen_random_uuid();
BEGIN
 BEGIN
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  INSERT INTO public.app_users(id,name,email,role) VALUES(target,'Deletion regression',target::text||'@example.invalid','general');
  INSERT INTO public.app_users(id,name,email,role,coach_id) VALUES(other_user,'Retained regression',other_user::text||'@example.invalid','general',target);
  INSERT INTO public.anthropometric_test_sessions(user_id) VALUES(target);
  INSERT INTO public.test_results_summary(user_id,test_type,test_date) VALUES(target,'regression',CURRENT_DATE);
  INSERT INTO public.tests(user_id,date) VALUES(target,CURRENT_DATE);
  PERFORM public.admin_delete_athlete(target);
  IF EXISTS(SELECT 1 FROM public.app_users WHERE id=target) THEN RAISE EXCEPTION 'User was not deleted'; END IF;
  IF EXISTS(SELECT 1 FROM public.anthropometric_test_sessions WHERE user_id=target) OR EXISTS(SELECT 1 FROM public.test_results_summary WHERE user_id=target) THEN RAISE EXCEPTION 'Test dependencies survived'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.app_users WHERE id=other_user AND coach_id IS NULL) THEN RAISE EXCEPTION 'Other user was not preserved'; END IF;
  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  PERFORM set_config('request.jwt.claim.sub','',true);
  BEGIN
   PERFORM public.admin_delete_athlete(other_user);
   RAISE EXCEPTION 'Unauthorized deletion allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF NOT EXISTS(SELECT 1 FROM public.app_users WHERE id=other_user) THEN RAISE EXCEPTION 'Unauthorized deletion changed data'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZZ001',MESSAGE='Rollback successful deletion tests';
 EXCEPTION WHEN SQLSTATE 'ZZ001' THEN RAISE NOTICE 'Deletion, dependencies, unrelated users, authorization passed; rolled back';
 END;
 IF EXISTS(SELECT 1 FROM public.app_users WHERE id IN(target,other_user)) THEN RAISE EXCEPTION 'Fixtures were not rolled back'; END IF;
END $$;