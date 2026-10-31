ALTER TABLE public.visit_packages ADD COLUMN subscription_id uuid REFERENCES public.user_subscriptions(id) ON DELETE SET NULL;
CREATE INDEX visit_packages_subscription_id_idx ON public.visit_packages(subscription_id);

-- Recover legacy links only when exactly one subscription matches the purchase.
WITH matches AS (
 SELECT vp.id, (array_agg(us.id))[1] AS subscription_id
 FROM public.visit_packages vp
 JOIN public.user_subscriptions us ON us.user_id=vp.user_id
 JOIN public.subscription_types st ON st.id=us.subscription_type_id AND st.subscription_mode='visit_based'
 WHERE vp.subscription_id IS NULL AND (
  (vp.payment_id IS NOT NULL AND us.payment_id=vp.payment_id)
  OR (vp.payment_id IS NULL AND us.start_date=vp.purchase_date)
 )
 GROUP BY vp.id HAVING count(*)=1
)
UPDATE public.visit_packages vp SET subscription_id=m.subscription_id FROM matches m WHERE vp.id=m.id;

CREATE OR REPLACE FUNCTION public.get_visit_booking_sections(p_user_id uuid)
RETURNS uuid[] LANGUAGE sql STABLE SET search_path=public AS $function$
 WITH packages AS (
  SELECT CASE WHEN us.id IS NOT NULL THEN st.allowed_sections ELSE vp.allowed_sections END AS sections
  FROM public.visit_packages vp
  LEFT JOIN public.user_subscriptions us ON us.id=vp.subscription_id AND us.user_id=vp.user_id
  LEFT JOIN public.subscription_types st ON st.id=us.subscription_type_id
  WHERE vp.user_id=p_user_id AND vp.status='active' AND vp.remaining_visits>0
    AND (vp.expiry_date IS NULL OR vp.expiry_date>=CURRENT_DATE)
 )
 SELECT CASE WHEN EXISTS (SELECT 1 FROM packages WHERE COALESCE(cardinality(sections),0)=0)
 THEN ARRAY[]::uuid[]
 ELSE COALESCE((SELECT array_agg(DISTINCT s) FROM packages CROSS JOIN LATERAL unnest(sections) s), ARRAY[]::uuid[]) END;
$function$;
REVOKE ALL ON FUNCTION public.get_visit_booking_sections(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_visit_booking_sections(uuid) TO authenticated, service_role;

-- Preserve all existing availability counters and videocall behavior.
DO $patch$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.get_user_available_bookings(uuid)'::regprocedure) INTO definition;
 IF position('user_allowed_sections := visit_package_sections;' in definition)=0 THEN
  RAISE EXCEPTION 'Expected visit section assignment missing';
 END IF;
 definition := replace(definition,'user_allowed_sections := visit_package_sections;', 'user_allowed_sections := public.get_visit_booking_sections(user_uuid);');
 EXECUTE definition;
END;
$patch$;

CREATE OR REPLACE FUNCTION public.enforce_gym_booking_sections()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE availability jsonb; sections uuid[];
BEGIN
 -- Status-only updates, cancellations and waiting-list reordering do not recheck eligibility.
 IF TG_OP='UPDATE' THEN
  IF NEW.user_id IS NOT DISTINCT FROM OLD.user_id
   AND NEW.section_id IS NOT DISTINCT FROM OLD.section_id
   AND NEW.booking_type IS NOT DISTINCT FROM OLD.booking_type
   AND NEW.booking_date IS NOT DISTINCT FROM OLD.booking_date
   AND NEW.booking_time IS NOT DISTINCT FROM OLD.booking_time THEN RETURN NEW; END IF;
 END IF;
 IF COALESCE(NEW.booking_type,'gym_visit') <> 'gym_visit' THEN RETURN NEW; END IF;
 availability := public.get_user_available_bookings(NEW.user_id);
 IF availability->>'type' NOT IN ('hypergym','visit_packages') THEN RETURN NEW; END IF;
 SELECT COALESCE(array_agg(value::uuid),ARRAY[]::uuid[]) INTO sections
 FROM jsonb_array_elements_text(COALESCE(availability->'allowed_sections','[]'::jsonb));
 IF cardinality(sections)>0 AND NOT (NEW.section_id=ANY(sections)) THEN
  RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Η συνδρομή σου δεν επιτρέπει κρατήσεις σε αυτό το τμήμα';
 END IF;
 RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.enforce_gym_booking_sections() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_gym_booking_sections() TO service_role;
CREATE TRIGGER enforce_gym_booking_sections BEFORE INSERT OR UPDATE ON public.booking_sessions
FOR EACH ROW EXECUTE FUNCTION public.enforce_gym_booking_sections();
CREATE TRIGGER enforce_gym_waiting_sections BEFORE INSERT OR UPDATE ON public.booking_waiting_list
FOR EACH ROW EXECUTE FUNCTION public.enforce_gym_booking_sections();