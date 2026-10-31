CREATE OR REPLACE FUNCTION public.get_coaching_availability(p_user uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$ DECLARE c uuid; r text; sub record; used integer; remaining integer; BEGIN
 SELECT u.coach_id,owner.role INTO c,r FROM public.app_users u LEFT JOIN public.app_users owner ON owner.id=u.coach_id WHERE u.id=p_user;
 IF c IS NULL OR r='admin' THEN RETURN public.get_user_available_bookings(p_user); END IF;
 SELECT s.*,t.name,t.visit_count,t.videocall_count INTO sub FROM public.coach_subscriptions s JOIN public.subscription_types t ON t.id=s.subscription_type_id WHERE s.user_id=p_user AND s.coach_id=c AND s.status='active' AND NOT COALESCE(s.is_paused,false) AND s.start_date<=CURRENT_DATE AND s.end_date>=CURRENT_DATE AND t.subscription_mode='videocall' AND t.coach_id=c ORDER BY s.end_date DESC LIMIT 1;
 IF sub.id IS NULL THEN RETURN jsonb_build_object('type','none','has_videocall',false,'videocall_packages_available',0); END IF;
 SELECT count(*) INTO used FROM public.booking_sessions WHERE user_id=p_user AND coach_id=c AND booking_type='videocall' AND status IN ('pending','confirmed','completed') AND booking_date BETWEEN sub.start_date AND sub.end_date;
 remaining:=GREATEST(0,COALESCE(sub.videocall_count,sub.visit_count,0)-used);
 RETURN jsonb_build_object('type','videocall','has_videocall',remaining>0,'videocall_packages_available',remaining,'subscription_end_date',sub.end_date,'allowed_sections','[]'::jsonb,'coach_id',c);
END $$;
REVOKE ALL ON FUNCTION public.get_coaching_availability(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_coaching_availability(uuid) TO authenticated;