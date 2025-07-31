-- Δημιουργία εγγραφών στον πίνακα app_users για τους χρήστες που λείπουν
INSERT INTO public.app_users (auth_user_id, email, name, user_status, role)
SELECT 
  au.id as auth_user_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'pending' as user_status,  -- Θέτουμε ως pending για έγκριση από admin
  'general' as role
FROM auth.users au
LEFT JOIN public.app_users app ON au.id = app.auth_user_id
WHERE app.id IS NULL;

-- Ενημέρωση της function που δημιουργεί νέους χρήστες να χειρίζεται και το email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.app_users (auth_user_id, email, name, user_status, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email_confirmed_at IS NOT NULL THEN 'active'
      ELSE 'pending'
    END,
    'general'
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, app_users.name),
    user_status = CASE 
      WHEN new.email_confirmed_at IS NOT NULL AND app_users.user_status = 'pending' THEN 'active'
      ELSE app_users.user_status
    END,
    updated_at = NOW();
  RETURN new;
END;
$$;