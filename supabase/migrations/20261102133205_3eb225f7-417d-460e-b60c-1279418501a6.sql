CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE user_name text; user_role text; linked_id uuid;
BEGIN
 -- app_metadata is set only by the trusted Auth Admin API, never signup user_metadata.
 IF NEW.raw_app_meta_data->>'app_user_id' IS NOT NULL THEN
  UPDATE public.app_users SET auth_user_id=NEW.id, updated_at=now()
  WHERE id=(NEW.raw_app_meta_data->>'app_user_id')::uuid
    AND auth_user_id IS NULL
    AND lower(trim(email))=lower(trim(NEW.email))
  RETURNING id INTO linked_id;
  IF linked_id IS NULL THEN
   RAISE EXCEPTION 'Existing app user cannot be linked' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 user_name:=COALESCE(NEW.raw_user_meta_data->>'name',split_part(NEW.email,'@',1));
 user_role:=COALESCE(NEW.raw_user_meta_data->>'role','general');
 IF user_role NOT IN ('general','coach','federation') THEN user_role:='general'; END IF;
 INSERT INTO public.app_users(id,auth_user_id,email,name,role,user_status,created_at,updated_at)
 VALUES(gen_random_uuid(),NEW.id,NEW.email,user_name,user_role,'active',now(),now());
 RETURN NEW;
END;
$function$;