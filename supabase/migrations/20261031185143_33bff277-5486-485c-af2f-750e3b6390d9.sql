CREATE OR REPLACE FUNCTION public.complete_thaihub_plan_purchase(p_order_id uuid, p_session_id text, p_amount integer, p_currency text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
 o public.thaihub_plan_orders%ROWTYPE;
 u public.app_users%ROWTYPE;
 v_type uuid;
 v_end date := (CURRENT_DATE + interval '1 year' - interval '1 day')::date;
BEGIN
 SELECT * INTO o FROM public.thaihub_plan_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.stripe_session_id IS DISTINCT FROM p_session_id OR o.amount_cents IS DISTINCT FROM p_amount OR p_currency IS DISTINCT FROM 'eur' THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o.status='paid' THEN RETURN true; END IF;
 IF o.status!='pending' OR o.plan NOT IN ('club','coach','federation') THEN RAISE EXCEPTION 'Order unavailable'; END IF;
 SELECT * INTO u FROM public.app_users WHERE id=o.user_id FOR UPDATE;
 IF NOT FOUND OR u.auth_user_id IS NULL OR u.role IS DISTINCT FROM 'general' OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u.auth_user_id AND role::text NOT IN ('general')) THEN RAISE EXCEPTION 'Account not eligible'; END IF;
 SELECT id INTO v_type FROM public.subscription_types WHERE coach_id IS NULL AND assigned_role=o.plan ORDER BY created_at,id LIMIT 1;
 IF v_type IS NULL THEN RAISE EXCEPTION 'Subscription type not configured for %',o.plan; END IF;
 -- The paid subscription trigger assigns the protected role and its compatibility mirror atomically.
 INSERT INTO public.user_subscriptions(user_id,subscription_type_id,start_date,end_date,status,is_paid,notes)
 VALUES(u.id,v_type,CURRENT_DATE,v_end,'active',true,'ThaiHub '||o.plan||' online');
 IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u.auth_user_id AND role::text=o.plan) OR NOT EXISTS (SELECT 1 FROM public.app_users WHERE id=u.id AND role=o.plan) THEN RAISE EXCEPTION 'Plan role activation failed'; END IF;
 UPDATE public.thaihub_plan_orders SET status='paid',updated_at=now() WHERE id=o.id;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_thaihub_plan_purchase(uuid,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_thaihub_plan_purchase(uuid,text,integer,text) TO service_role;