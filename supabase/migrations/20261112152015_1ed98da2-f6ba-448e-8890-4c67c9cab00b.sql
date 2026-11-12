ALTER FUNCTION public.import_optojump_attempt(uuid,jsonb) SECURITY INVOKER;
GRANT INSERT ON public.optojump_imports TO authenticated;
CREATE POLICY optojump_admin_insert ON public.optojump_imports FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'admin'));
