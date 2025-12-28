-- The user_roles table already exists with text column. Now just copy existing roles.
-- Skip 'trainer' since it doesn't exist in enum (but we use text column anyway)

-- Copy existing admin users to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user_id, 'admin'
FROM public.app_users 
WHERE role = 'admin' AND auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Copy existing coach users to user_roles table  
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user_id, 'coach'
FROM public.app_users 
WHERE role = 'coach' AND auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Copy existing athlete users to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user_id, 'athlete'
FROM public.app_users 
WHERE role = 'athlete' AND auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Copy existing parent users to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user_id, 'parent'
FROM public.app_users 
WHERE role = 'parent' AND auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Copy existing general users to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user_id, 'general'
FROM public.app_users 
WHERE role = 'general' AND auth_user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;