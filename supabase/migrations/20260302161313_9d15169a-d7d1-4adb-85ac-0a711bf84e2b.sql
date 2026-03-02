
-- Update handle_new_user_signup to allow 'federation' role during signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_name text;
  user_role text;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'general'
  );
  
  -- Validate role - allow general, coach, and federation
  IF user_role NOT IN ('general', 'coach', 'federation') THEN
    user_role := 'general';
  END IF;
  
  INSERT INTO public.app_users (
    id,
    auth_user_id,
    email,
    name,
    role,
    user_status,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    'active',
    now(),
    now()
  );
  
  RETURN NEW;
END;
$function$;
