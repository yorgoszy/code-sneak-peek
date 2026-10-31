ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS next_plan text;

CREATE OR REPLACE FUNCTION public.get_thaihub_plan_status(p_user_id uuid)
RETURNS TABLE(role text, end_date date, active boolean, next_plan text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u public.app_users%ROWTYPE;
BEGIN
 SELECT * INTO u FROM public.app_users WHERE id=p_user_id;
 IF NOT FOUND OR NOT (u.auth_user_id=auth.uid() OR public.is_admin_safe(auth.uid())) THEN RETURN; END IF;
 RETURN QUERY
 SELECT u.role::text,
   (SELECT max(s.end_date) FROM public.user_subscriptions s JOIN public.subscription_types t ON t.id=s.subscription_type_id
     WHERE s.user_id=u.id AND t.assigned_role IS NOT NULL AND s.status='active' AND s.is_paid),
   EXISTS (SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_types t ON t.id=s.subscription_type_id
     WHERE s.user_id=u.id AND t.assigned_role IS NOT NULL AND public.subscription_role_is_eligible(s.status,s.is_paid,s.is_paused,s.start_date,s.end_date,CURRENT_DATE)),
   (SELECT cp.next_plan FROM public.coach_profiles cp WHERE cp.coach_id=u.id);
END $$;
REVOKE ALL ON FUNCTION public.get_thaihub_plan_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_thaihub_plan_status(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_thaihub_next_plan(p_user_id uuid, p_plan text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u public.app_users%ROWTYPE;
BEGIN
 SELECT * INTO u FROM public.app_users WHERE id=p_user_id;
 IF NOT FOUND OR NOT (u.auth_user_id=auth.uid() OR public.is_admin_safe(auth.uid())) THEN RAISE EXCEPTION 'Not allowed'; END IF;
 IF u.role<>'coach' OR (p_plan IS NOT NULL AND p_plan<>'club') THEN RAISE EXCEPTION 'Invalid plan change'; END IF;
 INSERT INTO public.coach_profiles(coach_id,next_plan,updated_at) VALUES(u.id,p_plan,now())
 ON CONFLICT(coach_id) DO UPDATE SET next_plan=EXCLUDED.next_plan, updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.set_thaihub_next_plan(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_thaihub_next_plan(uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.complete_thaihub_plan_purchase(p_order_id uuid, p_session_id text, p_amount integer, p_currency text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
 o public.thaihub_plan_orders%ROWTYPE; u public.app_users%ROWTYPE; v_type uuid; renewal boolean;
 v_end date := (CURRENT_DATE + interval '1 year' - interval '1 day')::date;
BEGIN
 SELECT * INTO o FROM public.thaihub_plan_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.stripe_session_id IS DISTINCT FROM p_session_id OR o.amount_cents IS DISTINCT FROM p_amount OR p_currency IS DISTINCT FROM 'eur' THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o.status='paid' THEN RETURN true; END IF;
 IF o.status!='pending' OR o.plan NOT IN ('club','coach','federation') THEN RAISE EXCEPTION 'Order unavailable'; END IF;
 SELECT * INTO u FROM public.app_users WHERE id=o.user_id FOR UPDATE;
 IF NOT FOUND OR u.auth_user_id IS NULL THEN RAISE EXCEPTION 'Account not eligible'; END IF;
 renewal := u.role IN ('club','coach','federation');
 IF renewal THEN
   IF EXISTS (SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_types t ON t.id=s.subscription_type_id
       WHERE s.user_id=u.id AND t.assigned_role IS NOT NULL AND public.subscription_role_is_eligible(s.status,s.is_paid,s.is_paused,s.start_date,s.end_date,CURRENT_DATE))
     OR o.plan IS DISTINCT FROM COALESCE((SELECT next_plan FROM public.coach_profiles WHERE coach_id=u.id), u.role)
     OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u.auth_user_id AND role::text='admin')
   THEN RAISE EXCEPTION 'Renewal not eligible'; END IF;
   DELETE FROM public.user_roles WHERE user_id=u.auth_user_id AND role::text IN ('general','club','coach','federation') AND role::text<>o.plan;
   UPDATE public.app_users SET role=o.plan, updated_at=now() WHERE id=u.id;
   UPDATE public.coach_profiles SET next_plan=NULL, updated_at=now() WHERE coach_id=u.id;
 ELSIF u.role IS DISTINCT FROM 'general' OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u.auth_user_id AND role::text NOT IN ('general')) THEN
   RAISE EXCEPTION 'Account not eligible';
 END IF;
 SELECT id INTO v_type FROM public.subscription_types WHERE coach_id IS NULL AND assigned_role=o.plan ORDER BY created_at,id LIMIT 1;
 IF v_type IS NULL THEN RAISE EXCEPTION 'Subscription type not configured for %',o.plan; END IF;
 INSERT INTO public.user_subscriptions(user_id,subscription_type_id,start_date,end_date,status,is_paid,notes)
 VALUES(u.id,v_type,CURRENT_DATE,v_end,'active',true,'ThaiHub '||o.plan||CASE WHEN renewal THEN ' renewal' ELSE ' online' END);
 IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u.auth_user_id AND role::text=o.plan) OR NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=u.id AND role=o.plan) THEN RAISE EXCEPTION 'Plan role activation failed'; END IF;
 UPDATE public.thaihub_plan_orders SET status='paid',updated_at=now() WHERE id=o.id;
 RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.complete_thaihub_plan_purchase(uuid,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_thaihub_plan_purchase(uuid,text,integer,text) TO service_role;