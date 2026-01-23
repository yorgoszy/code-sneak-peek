-- Update the handle_new_user_signup function to accept role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name text;
  user_role text;
BEGIN
  -- Get name from metadata, fallback to email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Get role from metadata, default to 'general'
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'general'
  );
  
  -- Validate role - only allow 'general' or 'coach'
  IF user_role NOT IN ('general', 'coach') THEN
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
$$;