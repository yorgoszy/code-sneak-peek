CREATE TABLE public.thaihub_plan_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
 plan text NOT NULL CHECK (plan IN ('club','coach','federation')),
 amount_cents integer NOT NULL CHECK (amount_cents IN (45000,75000,150000)),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','expired')),
 stripe_session_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.thaihub_plan_orders TO authenticated;
GRANT ALL ON public.thaihub_plan_orders TO service_role;
ALTER TABLE public.thaihub_plan_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins read plan orders" ON public.thaihub_plan_orders FOR SELECT TO authenticated USING (user_id = public.current_app_user_id() OR public.is_admin_user());
CREATE UNIQUE INDEX thaihub_one_open_plan_order ON public.thaihub_plan_orders(user_id) WHERE status = 'pending';
CREATE TRIGGER update_thaihub_plan_orders BEFORE UPDATE ON public.thaihub_plan_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE FUNCTION public.complete_thaihub_plan_purchase(p_order_id uuid, p_session_id text, p_amount integer, p_currency text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.thaihub_plan_orders%ROWTYPE; u public.app_users%ROWTYPE; v_end date := (CURRENT_DATE + interval '1 year' - interval '1 day')::date;
BEGIN
 SELECT * INTO o FROM public.thaihub_plan_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.stripe_session_id IS DISTINCT FROM p_session_id OR o.amount_cents IS DISTINCT FROM p_amount OR p_currency IS DISTINCT FROM 'eur' THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
 IF o.status='paid' THEN RETURN true; END IF;
 IF o.status!='pending' THEN RAISE EXCEPTION 'Order unavailable'; END IF;
 SELECT * INTO u FROM public.app_users WHERE id=o.user_id FOR UPDATE;
 IF u.auth_user_id IS NULL OR u.role IS DISTINCT FROM 'general' THEN RAISE EXCEPTION 'Account not eligible'; END IF;
 UPDATE public.app_users SET role=o.plan, updated_at=now() WHERE id=u.id;
 IF o.plan='coach' THEN
  DELETE FROM public.user_roles WHERE user_id=u.auth_user_id AND role='general';
  INSERT INTO public.user_roles(user_id,role) SELECT u.auth_user_id,'coach'::public.user_role WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=u.auth_user_id AND role='coach');
 END IF;
 IF o.plan IN ('club','coach') THEN
  INSERT INTO public.coach_profiles(coach_id,is_active,subscription_end_date,updated_at) VALUES(u.id,true,v_end,now()) ON CONFLICT(coach_id) DO UPDATE SET is_active=true,subscription_end_date=EXCLUDED.subscription_end_date,updated_at=now();
 END IF;
 INSERT INTO public.user_subscriptions(user_id,subscription_type_id,start_date,end_date,status,is_paid,notes)
 VALUES(u.id,'9c46ca26-9837-4eb8-8ced-11e25ecf8388',CURRENT_DATE,v_end,'active',true,'ThaiHub '||o.plan||' online');
 UPDATE public.thaihub_plan_orders SET status='paid' WHERE id=o.id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.complete_thaihub_plan_purchase(uuid,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_thaihub_plan_purchase(uuid,text,integer,text) TO service_role;