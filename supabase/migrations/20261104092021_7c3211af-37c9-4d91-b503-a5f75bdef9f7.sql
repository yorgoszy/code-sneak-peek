ALTER TABLE public.coach_subscriptions ADD COLUMN IF NOT EXISTS total_visits integer;

CREATE OR REPLACE FUNCTION private.get_coach_booking_availability(p_user uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE c uuid; r text; sub record; used integer; remaining integer; tot integer; BEGIN
SELECT u.coach_id,owner.role INTO c,r FROM public.app_users u LEFT JOIN public.app_users owner ON owner.id=u.coach_id WHERE u.id=p_user;
IF c IS NULL OR r='admin' THEN RETURN public.get_user_available_bookings(p_user); END IF;
SELECT s.*,t.name,t.visit_count,t.subscription_mode,t.allowed_sections INTO sub FROM public.coach_subscriptions s JOIN public.subscription_types t ON t.id=s.subscription_type_id WHERE s.user_id=p_user AND s.coach_id=c AND s.status='active' AND NOT COALESCE(s.is_paused,false) AND s.start_date<=CURRENT_DATE AND s.end_date>=CURRENT_DATE AND t.subscription_mode<>'videocall' AND t.coach_id=c ORDER BY s.end_date DESC LIMIT 1;
IF sub.id IS NULL THEN RETURN jsonb_build_object('type','none','coach_id',c,'allowed_sections','[]'::jsonb); END IF;
tot := COALESCE(sub.total_visits, sub.visit_count, 0);
SELECT count(*) INTO used FROM public.booking_sessions WHERE user_id=p_user AND coach_id=c AND booking_type='gym_visit' AND status IN('pending','confirmed','completed') AND booking_date BETWEEN sub.start_date AND sub.end_date;
remaining:=CASE WHEN sub.subscription_mode='visit_based' THEN GREATEST(0,tot-used) ELSE 999999 END;
RETURN jsonb_build_object('type','visit_packages','coach_id',c,'has_gym_access',remaining>0,'available_visits',remaining,'total_visits',CASE WHEN sub.subscription_mode='visit_based' THEN tot ELSE 999999 END,'subscription_name',sub.name,'allowed_sections',COALESCE(to_jsonb(sub.allowed_sections),'[]'::jsonb)); END $function$;

CREATE OR REPLACE FUNCTION public.get_coaching_availability(p_user uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path TO 'public'
AS $function$ DECLARE c uuid; r text; sub record; used integer; remaining integer; BEGIN
 SELECT u.coach_id,owner.role INTO c,r FROM public.app_users u LEFT JOIN public.app_users owner ON owner.id=u.coach_id WHERE u.id=p_user;
 IF c IS NULL OR r='admin' THEN RETURN public.get_user_available_bookings(p_user); END IF;
 SELECT s.*,t.name,t.visit_count,t.videocall_count INTO sub FROM public.coach_subscriptions s JOIN public.subscription_types t ON t.id=s.subscription_type_id WHERE s.user_id=p_user AND s.coach_id=c AND s.status='active' AND NOT COALESCE(s.is_paused,false) AND s.start_date<=CURRENT_DATE AND s.end_date>=CURRENT_DATE AND t.subscription_mode='videocall' AND t.coach_id=c ORDER BY s.end_date DESC LIMIT 1;
 IF sub.id IS NULL THEN RETURN jsonb_build_object('type','none','has_videocall',false,'videocall_packages_available',0); END IF;
 SELECT count(*) INTO used FROM public.booking_sessions WHERE user_id=p_user AND coach_id=c AND booking_type='videocall' AND status IN ('pending','confirmed','completed') AND booking_date BETWEEN sub.start_date AND sub.end_date;
 remaining:=GREATEST(0,COALESCE(sub.total_visits,sub.videocall_count,sub.visit_count,0)-used);
 RETURN jsonb_build_object('type','videocall','has_videocall',remaining>0,'videocall_packages_available',remaining,'subscription_end_date',sub.end_date,'allowed_sections','[]'::jsonb,'coach_id',c);
END $function$;