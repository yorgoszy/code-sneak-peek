DROP FUNCTION private.get_user_subscription_scope(uuid);
CREATE OR REPLACE FUNCTION private.get_user_subscription_scope(p_user_id uuid)
RETURNS TABLE (coach_id uuid, is_coach_managed boolean, owner_role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT u.coach_id, coalesce(c.role IN ('coach','club'),false), c.role FROM public.app_users u LEFT JOIN public.app_users c ON c.id=u.coach_id WHERE u.id=p_user_id AND (u.auth_user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR u.coach_id=public.get_app_user_id_safe(auth.uid()) OR auth.role()='service_role') $$;

DROP FUNCTION public.get_user_subscription_scope(uuid);
CREATE FUNCTION public.get_user_subscription_scope(p_user_id uuid) RETURNS TABLE(coach_id uuid,is_coach_managed boolean,owner_role text) LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT coach_id, is_coach_managed, owner_role FROM private.get_user_subscription_scope(p_user_id) $$;
REVOKE ALL ON FUNCTION public.get_user_subscription_scope(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_scope(uuid) TO authenticated,service_role;