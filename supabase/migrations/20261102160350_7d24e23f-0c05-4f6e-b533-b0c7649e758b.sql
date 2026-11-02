CREATE OR REPLACE FUNCTION public.get_user_subscription_scope(p_user_id uuid)
RETURNS TABLE (coach_id uuid, is_coach_managed boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT u.coach_id, coalesce(c.role IN ('coach','club'),false) FROM public.app_users u LEFT JOIN public.app_users c ON c.id=u.coach_id WHERE u.id=p_user_id AND (u.auth_user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR u.coach_id=public.get_app_user_id_safe(auth.uid()) OR auth.role()='service_role') $$;
REVOKE ALL ON FUNCTION public.get_user_subscription_scope(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_scope(uuid) TO authenticated, service_role;
GRANT SELECT ON public.coach_subscriptions, public.coach_receipts TO authenticated;
CREATE POLICY coach_subscription_recipient_read ON public.coach_subscriptions FOR SELECT TO authenticated USING (user_id=public.get_app_user_id_safe(auth.uid()) AND public.owns_coaching_user(user_id,coach_id));
CREATE POLICY coach_receipt_recipient_read ON public.coach_receipts FOR SELECT TO authenticated USING (user_id=public.get_app_user_id_safe(auth.uid()) AND public.owns_coaching_user(user_id,coach_id));
CREATE OR REPLACE FUNCTION public.validate_coach_subscription_links() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM public.app_users u JOIN public.app_users c ON c.id=u.coach_id WHERE u.id=NEW.user_id AND u.coach_id=NEW.coach_id AND c.role IN ('coach','club')) THEN RAISE EXCEPTION 'User must belong to the subscription coach'; END IF;
IF NOT EXISTS (SELECT 1 FROM public.subscription_types t WHERE t.id=NEW.subscription_type_id AND t.coach_id=NEW.coach_id) THEN RAISE EXCEPTION 'Subscription type must belong to the same coach'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER validate_coach_subscription_links BEFORE INSERT OR UPDATE OF user_id,coach_id,subscription_type_id ON public.coach_subscriptions FOR EACH ROW EXECUTE FUNCTION public.validate_coach_subscription_links();