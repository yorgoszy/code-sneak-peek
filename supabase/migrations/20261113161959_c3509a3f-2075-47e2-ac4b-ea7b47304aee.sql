CREATE SCHEMA IF NOT EXISTS measurement_private; REVOKE ALL ON SCHEMA measurement_private FROM PUBLIC,anon; GRANT USAGE ON SCHEMA measurement_private TO authenticated,service_role;
ALTER FUNCTION public.can_access_measurements(uuid) SET SCHEMA measurement_private;
CREATE OR REPLACE FUNCTION public.can_access_measurements(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT measurement_private.can_access_measurements(p_user); $$;
REVOKE ALL ON FUNCTION public.can_access_measurements(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.can_access_measurements(uuid) TO authenticated,service_role;
CREATE POLICY measurement_import_own_read ON public.optojump_imports FOR SELECT TO authenticated USING(measurement_private.can_access_measurements(user_id));
ALTER FUNCTION public.measurement_xml_candidates(uuid,text) SECURITY INVOKER;