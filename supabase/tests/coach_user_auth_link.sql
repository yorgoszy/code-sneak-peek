DO $$
DECLARE target uuid:=gen_random_uuid(); login_id uuid:=gen_random_uuid();
 email_value text:=target::text||'@example.invalid'; rejected boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.app_users(id,name,email,role) VALUES(target,'Auth link regression',email_value,'athlete');
  INSERT INTO auth.users(id,email,raw_app_meta_data,raw_user_meta_data)
  VALUES(login_id,email_value,jsonb_build_object('app_user_id',target),'{"name":"Must not replace"}');
  IF NOT EXISTS(SELECT 1 FROM public.app_users WHERE id=target AND auth_user_id=login_id
    AND name='Auth link regression' AND role='athlete') THEN RAISE EXCEPTION 'Existing profile was not preserved and linked'; END IF;
  IF (SELECT count(*) FROM public.app_users WHERE email=email_value)<>1 THEN RAISE EXCEPTION 'Duplicate profile'; END IF;
  BEGIN
   INSERT INTO auth.users(id,email,raw_app_meta_data)
   VALUES(gen_random_uuid(),'wrong-'||email_value,jsonb_build_object('app_user_id',target));
  EXCEPTION WHEN check_violation THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Existing account overwrite was not blocked'; END IF;
  rejected:=false;
  BEGIN
   INSERT INTO auth.users(id,email,raw_user_meta_data)
   VALUES(gen_random_uuid(),email_value,jsonb_build_object('app_user_id',target));
  EXCEPTION WHEN unique_violation THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Public signup metadata was trusted'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZZ001',MESSAGE='Rollback auth linking tests';
 EXCEPTION WHEN SQLSTATE 'ZZ001' THEN RAISE NOTICE 'Profile linked once, preserved; overwrite and public metadata blocked; fixtures rolled back';
 END;
 IF EXISTS(SELECT 1 FROM auth.users WHERE id=login_id) OR EXISTS(SELECT 1 FROM public.app_users WHERE id=target) THEN RAISE EXCEPTION 'Fixtures survived rollback'; END IF;
END $$;