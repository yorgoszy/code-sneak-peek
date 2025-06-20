
-- Ενημέρωση της function για να περιλαμβάνει admins
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_subscriptions us
    JOIN public.app_users au ON us.user_id = au.id
    WHERE au.id = user_uuid
      AND us.status = 'active'
      AND us.end_date >= CURRENT_DATE
  ) OR EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE id = user_uuid 
      AND (subscription_status = 'active' OR role = 'admin')
  );
$$;
