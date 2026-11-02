CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated,service_role;
ALTER FUNCTION public.get_user_subscription_scope(uuid) SET SCHEMA private;
CREATE FUNCTION public.get_user_subscription_scope(p_user_id uuid) RETURNS TABLE(coach_id uuid,is_coach_managed boolean) LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT * FROM private.get_user_subscription_scope(p_user_id) $$;
REVOKE ALL ON FUNCTION public.get_user_subscription_scope(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_scope(uuid) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.validate_coach_subscription_links() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coach_subscription_links() TO service_role;