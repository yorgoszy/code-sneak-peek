ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'club';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'federation';
ALTER TABLE public.subscription_types ADD COLUMN assigned_role text;

CREATE OR REPLACE FUNCTION public.validate_subscription_assigned_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.assigned_role IS NOT NULL AND NEW.assigned_role NOT IN ('club','coach','federation') THEN RAISE EXCEPTION 'Invalid subscription role'; END IF;
 IF TG_OP='INSERT' OR NEW.assigned_role IS DISTINCT FROM OLD.assigned_role OR NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
  IF NEW.assigned_role IS NOT NULL THEN
   IF NEW.coach_id IS NOT NULL OR (COALESCE(auth.role(),'') <> 'service_role' AND NOT public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Only administrators can configure subscription roles'; END IF;
  ELSIF TG_OP='UPDATE' AND OLD.assigned_role IS NOT NULL AND COALESCE(auth.role(),'') <> 'service_role' AND NOT public.has_role(auth.uid(),'admin') THEN
   RAISE EXCEPTION 'Only administrators can configure subscription roles';
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_subscription_assigned_role() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_subscription_assigned_role BEFORE INSERT OR UPDATE ON public.subscription_types FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_assigned_role();

CREATE OR REPLACE FUNCTION public.subscription_role_is_eligible(p_status text,p_paid boolean,p_paused boolean,p_start date,p_end date,p_today date) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT COALESCE(p_status='active' AND p_paid IS TRUE AND NOT COALESCE(p_paused,false) AND p_start<=p_today AND p_end>=p_today,false);
$$;
GRANT EXECUTE ON FUNCTION public.subscription_role_is_eligible(text,boolean,boolean,date,date,date) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.apply_subscription_assigned_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_role text; v_user public.app_users%ROWTYPE; v_rank integer; v_new_rank integer;
BEGIN
 IF NOT public.subscription_role_is_eligible(NEW.status,NEW.is_paid,NEW.is_paused,NEW.start_date,NEW.end_date,CURRENT_DATE) THEN RETURN NEW; END IF;
 SELECT assigned_role INTO v_role FROM public.subscription_types WHERE id=NEW.subscription_type_id AND coach_id IS NULL;
 IF v_role IS NULL THEN RETURN NEW; END IF;
 IF COALESCE(auth.role(),'') <> 'service_role' AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only verified payments or administrators can activate subscription roles'; END IF;
 SELECT * INTO v_user FROM public.app_users WHERE id=NEW.user_id FOR UPDATE;
 IF v_user.auth_user_id IS NULL THEN RAISE EXCEPTION 'A signed-in account is required for this subscription'; END IF;
 IF v_user.role NOT IN ('general','athlete','parent','club','coach','federation') OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=v_user.auth_user_id AND role='admin') THEN RETURN NEW; END IF;
 v_rank := CASE v_user.role WHEN 'club' THEN 1 WHEN 'coach' THEN 2 WHEN 'federation' THEN 3 ELSE 0 END;
 v_new_rank := CASE v_role WHEN 'club' THEN 1 WHEN 'coach' THEN 2 WHEN 'federation' THEN 3 END;
 IF v_rank>v_new_rank THEN RETURN NEW; END IF;
 DELETE FROM public.user_roles WHERE user_id=v_user.auth_user_id AND role::text IN ('general','athlete','parent','club','coach','federation');
 INSERT INTO public.user_roles(user_id,role) VALUES(v_user.auth_user_id,v_role::public.user_role);
 -- Compatibility mirror for the existing dashboard queries; privileges are written to protected user_roles first.
 UPDATE public.app_users SET role=v_role,updated_at=now() WHERE id=v_user.id;
 IF v_role IN ('club','coach') THEN
 INSERT INTO public.coach_profiles(coach_id,is_active,subscription_end_date,updated_at) VALUES(v_user.id,true,NEW.end_date,now()) ON CONFLICT(coach_id) DO UPDATE SET is_active=true,subscription_end_date=GREATEST(public.coach_profiles.subscription_end_date,EXCLUDED.subscription_end_date),updated_at=now();
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.apply_subscription_assigned_role() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER apply_subscription_assigned_role AFTER INSERT OR UPDATE OF subscription_type_id,status,is_paid,is_paused,start_date,end_date ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.apply_subscription_assigned_role();