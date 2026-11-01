CREATE OR REPLACE FUNCTION public.force_delete_athlete(athlete_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref record; target_auth uuid;
BEGIN
  IF COALESCE(auth.role(),'') <> 'service_role' AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only administrators can delete users' USING ERRCODE='42501';
  END IF;
  SELECT auth_user_id INTO target_auth FROM public.app_users WHERE id=athlete_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found' USING ERRCODE='P0002'; END IF;
  IF target_auth IS NOT NULL AND target_auth=auth.uid() THEN RAISE EXCEPTION 'Cannot delete your own account'; END IF;

  -- Remove dependent rows before their parent subscriptions/payments/completions.
  DELETE FROM public.exercise_results WHERE workout_completion_id IN (SELECT id FROM public.workout_completions WHERE user_id=athlete_id);
  DELETE FROM public.thaihub_upgrade_orders WHERE user_id=athlete_id OR subscription_id IN (SELECT id FROM public.user_subscriptions WHERE user_id=athlete_id);
  DELETE FROM public.receipts WHERE user_id=athlete_id OR payment_id IN (SELECT id FROM public.payments WHERE user_id=athlete_id);
  DELETE FROM public.user_subscriptions WHERE user_id=athlete_id;
  DELETE FROM public.payments WHERE user_id=athlete_id;
  DELETE FROM public.coach_receipts WHERE coach_id=athlete_id OR user_id=athlete_id OR coach_user_id IN (SELECT id FROM public.coach_users WHERE coach_id=athlete_id) OR subscription_id IN (SELECT id FROM public.coach_subscriptions WHERE coach_id=athlete_id OR user_id=athlete_id);
  DELETE FROM public.coach_subscriptions WHERE coach_id=athlete_id OR user_id=athlete_id;
  DELETE FROM public.expenses WHERE coach_id=athlete_id;
  DELETE FROM public.coach_profiles WHERE coach_id=athlete_id;
  DELETE FROM public.coach_course_purchases WHERE coach_id=athlete_id;
  DELETE FROM public.course_questions WHERE coach_id=athlete_id;
  DELETE FROM public.block_templates WHERE created_by=athlete_id;
  DELETE FROM public.competitions WHERE user_id=athlete_id;
  DELETE FROM public.closed_days WHERE created_by=athlete_id;
  DELETE FROM public.booking_sessions WHERE coach_id=athlete_id OR user_id=athlete_id;
  DELETE FROM public.booking_waiting_list WHERE coach_id=athlete_id OR user_id=athlete_id;
  DELETE FROM public.booking_sections WHERE coach_id=athlete_id;
  DELETE FROM public.anthropometric_measurements WHERE test_id IN (SELECT id FROM public.tests WHERE user_id=athlete_id);
  DELETE FROM public.tests WHERE user_id=athlete_id;
  DELETE FROM public.program_assignments WHERE user_id=athlete_id;

  -- Required restrictive references are user-owned records; nullable references
  -- are attribution only. Cascading and SET NULL relationships retain their
  -- declared semantics. Other app_users are never deleted.
  FOR ref IN
    SELECT DISTINCT c.conrelid::regclass AS relation, a.attname, a.attnotnull
    FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
    WHERE c.contype='f' AND c.confrelid='public.app_users'::regclass
      AND c.confdeltype IN ('a','r') AND cardinality(c.conkey)=1
      AND c.connamespace='public'::regnamespace
  LOOP
    IF ref.attnotnull THEN
      EXECUTE format('DELETE FROM %s WHERE %I = $1',ref.relation,ref.attname) USING athlete_id;
    ELSE
      EXECUTE format('UPDATE %s SET %I = NULL WHERE %I = $1',ref.relation,ref.attname,ref.attname) USING athlete_id;
    END IF;
  END LOOP;
  DELETE FROM public.app_users WHERE id=athlete_id;
  IF EXISTS (SELECT 1 FROM public.app_users WHERE id=athlete_id) THEN RAISE EXCEPTION 'User deletion did not complete'; END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.admin_delete_athlete(athlete_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.force_delete_athlete(athlete_id); END;
$$;
CREATE OR REPLACE FUNCTION public.admin_delete_athlete_memberships(athlete_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF COALESCE(auth.role(),'')<>'service_role' AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only administrators can delete users' USING ERRCODE='42501'; END IF;
 DELETE FROM public.receipts WHERE payment_id IN (SELECT id FROM public.payments WHERE user_id=athlete_id);
 UPDATE public.user_subscriptions SET payment_id=NULL WHERE payment_id IN (SELECT id FROM public.payments WHERE user_id=athlete_id);
 DELETE FROM public.payments WHERE user_id=athlete_id;
END; $$;
REVOKE ALL ON FUNCTION public.force_delete_athlete(uuid),public.admin_delete_athlete(uuid),public.admin_delete_athlete_memberships(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.force_delete_athlete(uuid),public.admin_delete_athlete(uuid),public.admin_delete_athlete_memberships(uuid) TO authenticated,service_role;