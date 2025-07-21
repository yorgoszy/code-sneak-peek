-- Προσθήκη triggered function για ενημέρωση ληγμένων συνδρομών
CREATE OR REPLACE FUNCTION public.check_and_update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- Προσθήκη στήλης για tracking αρχειοθέτησης
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Δημιουργία index για βελτιστοποίηση
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date_status 
ON public.user_subscriptions (end_date, status) 
WHERE status IN ('active', 'expired');

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_archived_at 
ON public.user_subscriptions (archived_at) 
WHERE archived_at IS NOT NULL;