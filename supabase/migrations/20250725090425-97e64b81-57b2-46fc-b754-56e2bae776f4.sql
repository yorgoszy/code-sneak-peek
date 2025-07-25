-- Continue fixing remaining functions with search_path

CREATE OR REPLACE FUNCTION public.renew_subscription(original_subscription_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    original_sub RECORD;
    new_start_date DATE;
    new_end_date DATE;
    new_subscription_id UUID;
BEGIN
    -- Λήψη στοιχείων αρχικής συνδρομής
    SELECT user_id, subscription_type_id, end_date, status
    INTO original_sub
    FROM public.user_subscriptions 
    WHERE id = original_subscription_id;
    
    -- Καθορισμός ημερομηνίας έναρξης νέας συνδρομής (πάντα επόμενη ημέρα από τη λήξη)
    new_start_date := original_sub.end_date + INTERVAL '1 day';
    
    -- Υπολογισμός ημερομηνίας λήξης με βάση τους μήνες
    SELECT new_start_date + INTERVAL '1 month' * st.duration_months - INTERVAL '1 day'
    INTO new_end_date
    FROM public.subscription_types st
    WHERE st.id = original_sub.subscription_type_id;
    
    -- Δημιουργία νέας συνδρομής
    INSERT INTO public.user_subscriptions (
        user_id, 
        subscription_type_id, 
        start_date, 
        end_date, 
        status
    )
    VALUES (
        original_sub.user_id,
        original_sub.subscription_type_id,
        new_start_date,
        new_end_date,
        'active'
    )
    RETURNING id INTO new_subscription_id;
    
    -- Ενημέρωση κατάστασης χρήστη
    UPDATE public.app_users 
    SET subscription_status = 'active'
    WHERE id = original_sub.user_id;
    
    RETURN new_subscription_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_visit(p_user_id uuid, p_created_by uuid DEFAULT NULL::uuid, p_visit_type text DEFAULT 'manual'::text, p_notes text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  visit_id UUID;
  package_id UUID;
BEGIN
  -- Έλεγχος για ενεργό visit package
  SELECT id INTO package_id
  FROM public.visit_packages
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND remaining_visits > 0
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
  ORDER BY purchase_date DESC
  LIMIT 1;
  
  -- Καταγραφή επίσκεψης
  INSERT INTO public.user_visits (user_id, created_by, visit_type, notes)
  VALUES (p_user_id, p_created_by, p_visit_type, p_notes)
  RETURNING id INTO visit_id;
  
  -- Ενημέρωση visit package αν υπάρχει
  IF package_id IS NOT NULL THEN
    UPDATE public.visit_packages 
    SET remaining_visits = remaining_visits - 1,
        updated_at = now(),
        status = CASE WHEN remaining_visits - 1 = 0 THEN 'used' ELSE 'active' END
    WHERE id = package_id;
  END IF;
  
  RETURN visit_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_and_update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ενημέρωση συνδρομών που έχουν λήξει και είναι ακόμα active σε expired
  UPDATE public.user_subscriptions 
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    end_date < CURRENT_DATE 
    AND status = 'active'
    AND is_paused = false;

  -- Αρχειοθέτηση συνδρομών που έχουν λήξει πριν από 1 μήνα
  UPDATE public.user_subscriptions 
  SET 
    archived_at = now(),
    updated_at = now()
  WHERE 
    end_date < (CURRENT_DATE - INTERVAL '1 month')
    AND status = 'expired'
    AND archived_at IS NULL;

  -- Ενημέρωση app_users subscription_status για χρήστες χωρίς ενεργή συνδρομή
  UPDATE public.app_users 
  SET subscription_status = 'inactive'
  WHERE id IN (
    SELECT DISTINCT u.id 
    FROM public.app_users u
    LEFT JOIN public.user_subscriptions us ON u.id = us.user_id 
      AND us.status = 'active' 
      AND us.end_date >= CURRENT_DATE
      AND (us.is_paused = false OR us.is_paused IS NULL)
    WHERE us.id IS NULL 
      AND u.subscription_status = 'active'
  );

  -- Ενημέρωση app_users subscription_status για χρήστες με ενεργή συνδρομή
  UPDATE public.app_users 
  SET subscription_status = 'active'
  WHERE id IN (
    SELECT DISTINCT us.user_id 
    FROM public.user_subscriptions us
    WHERE us.status = 'active' 
      AND us.end_date >= CURRENT_DATE
      AND (us.is_paused = false OR us.is_paused IS NULL)
  ) AND subscription_status != 'active';

END;
$function$;