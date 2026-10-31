CREATE OR REPLACE FUNCTION public.complete_thaihub_upgrade(p_order_id uuid, p_session_id text, p_amount integer, p_currency text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE o public.thaihub_upgrade_orders%ROWTYPE; s public.user_subscriptions%ROWTYPE; u public.app_users%ROWTYPE; coach_type uuid;
BEGIN
 SELECT * INTO o FROM public.thaihub_upgrade_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.stripe_session_id IS DISTINCT FROM p_session_id OR o.amount_cents IS DISTINCT FROM p_amount OR p_currency IS DISTINCT FROM 'eur' THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o.status='paid' THEN RETURN true; END IF;
 IF o.status!='pending' THEN RAISE EXCEPTION 'Order unavailable'; END IF;
 SELECT * INTO s FROM public.user_subscriptions WHERE id=o.subscription_id FOR UPDATE;
 SELECT * INTO u FROM public.app_users WHERE id=o.user_id FOR UPDATE;
 IF s.user_id IS DISTINCT FROM o.user_id OR s.start_date IS DISTINCT FROM o.source_start OR s.end_date IS DISTINCT FROM o.source_end OR s.status!='active' OR COALESCE(s.is_paused,false) OR s.end_date<CURRENT_DATE OR u.role!='club' OR u.auth_user_id IS NULL THEN RAISE EXCEPTION 'Subscription changed'; END IF;
 DELETE FROM public.user_roles WHERE user_id=u.auth_user_id AND role IN ('general','club');
 INSERT INTO public.user_roles(user_id,role) SELECT u.auth_user_id,'coach'::public.user_role WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u.auth_user_id AND role='coach');
 UPDATE public.app_users SET role='coach', updated_at=now() WHERE id=u.id;
 INSERT INTO public.coach_profiles(coach_id,is_active,subscription_end_date,updated_at) VALUES(u.id,true,s.end_date,now()) ON CONFLICT(coach_id) DO UPDATE SET is_active=true,subscription_end_date=EXCLUDED.subscription_end_date,updated_at=now();
 SELECT id INTO coach_type FROM public.subscription_types WHERE assigned_role='coach' AND is_active AND coach_id IS NULL ORDER BY created_at DESC LIMIT 1;
 IF coach_type IS NOT NULL THEN UPDATE public.user_subscriptions SET subscription_type_id=coach_type, updated_at=now() WHERE id=s.id; END IF;
 UPDATE public.thaihub_upgrade_orders SET status='paid' WHERE id=o.id;
 RETURN true;
END; $function$;
REVOKE ALL ON FUNCTION public.complete_thaihub_upgrade(uuid,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_thaihub_upgrade(uuid,text,integer,text) TO service_role;