CREATE OR REPLACE FUNCTION public.undo_visit_package(p_package_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  pkg public.visit_packages%ROWTYPE;
  latest_visit_id uuid;
  next_purchase timestamptz;
  result integer;
BEGIN
  SELECT * INTO pkg FROM public.visit_packages WHERE id = p_package_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package not found or access denied'; END IF;
  IF pkg.remaining_visits >= pkg.total_visits THEN RAISE EXCEPTION 'No used visits to remove'; END IF;
  IF pkg.status NOT IN ('active', 'used', 'expired') THEN RAISE EXCEPTION 'Package unavailable'; END IF;

  SELECT MIN(purchase_date) INTO next_purchase FROM public.visit_packages
  WHERE user_id = pkg.user_id AND purchase_date > pkg.purchase_date;

  -- Legacy visits have no package foreign key. Match the existing package-history
  -- date window, and never remove online bookings (which have their own cancellation).
  SELECT id INTO latest_visit_id FROM public.user_visits
  WHERE user_id = pkg.user_id
    AND visit_type IN ('package', 'qr_scan', 'manual')
    AND created_at >= pkg.purchase_date
    AND (next_purchase IS NULL OR created_at < next_purchase)
  ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE;

  IF latest_visit_id IS NOT NULL THEN
    DELETE FROM public.user_visits WHERE id = latest_visit_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Visit could not be removed'; END IF;
  END IF;

  UPDATE public.visit_packages
  SET remaining_visits = remaining_visits + 1,
      status = CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE THEN 'expired' ELSE 'active' END,
      updated_at = now()
  WHERE id = pkg.id
  RETURNING remaining_visits INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package could not be updated'; END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.undo_visit_package(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.undo_visit_package(uuid) TO authenticated, service_role;