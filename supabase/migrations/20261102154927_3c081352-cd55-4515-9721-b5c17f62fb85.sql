CREATE TABLE IF NOT EXISTS public.pending_auth_links (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.pending_auth_links FROM anon, authenticated;
GRANT ALL ON public.pending_auth_links TO service_role;
ALTER TABLE public.pending_auth_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE user_name text; user_role text; linked_id uuid; target_id uuid; link_token uuid;
BEGIN
 BEGIN
   link_token := NULLIF(NEW.raw_user_meta_data->>'link_token','')::uuid;
 EXCEPTION WHEN others THEN link_token := NULL;
 END;
 IF link_token IS NOT NULL THEN
  DELETE FROM public.pending_auth_links
   WHERE token = link_token
     AND expires_at > now()
     AND lower(trim(email)) = lower(trim(NEW.email))
  RETURNING app_user_id INTO target_id;
  IF target_id IS NOT NULL THEN
   UPDATE public.app_users SET auth_user_id = NEW.id, updated_at = now()
    WHERE id = target_id AND auth_user_id IS NULL
      AND lower(trim(email)) = lower(trim(NEW.email))
   RETURNING id INTO linked_id;
   IF linked_id IS NULL THEN
    RAISE EXCEPTION 'Existing app user cannot be linked' USING ERRCODE='23514';
   END IF;
   RETURN NEW;
  END IF;
 END IF;

 IF NEW.raw_app_meta_data->>'app_user_id' IS NOT NULL THEN
  UPDATE public.app_users SET auth_user_id = NEW.id, updated_at = now()
  WHERE id = (NEW.raw_app_meta_data->>'app_user_id')::uuid
    AND auth_user_id IS NULL
    AND lower(trim(email)) = lower(trim(NEW.email))
  RETURNING id INTO linked_id;
  IF linked_id IS NOT NULL THEN
   RETURN NEW;
  END IF;
 END IF;

 user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1));
 user_role := COALESCE(NEW.raw_user_meta_data->>'role','general');
 IF user_role NOT IN ('general','coach','federation') THEN user_role := 'general'; END IF;
 INSERT INTO public.app_users(id,auth_user_id,email,name,role,user_status,created_at,updated_at)
 VALUES (gen_random_uuid(), NEW.id, NEW.email, user_name, user_role, 'active', now(), now());
 RETURN NEW;
END;
$function$;