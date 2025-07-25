-- Phase 2: Database Function Security - Add search_path to all functions

-- Update all existing functions to include search_path for security
CREATE OR REPLACE FUNCTION public.update_ai_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_user_qr_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Δημιουργία QR code με βάση το user ID
  NEW.qr_code = encode(NEW.id::text::bytea, 'base64');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NEW.issued_date, 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM NEW.created_at)::text, 10, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.pause_subscription(subscription_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    days_remaining INTEGER;
BEGIN
    -- Υπολογισμός υπόλοιπων ημερών
    SELECT GREATEST(0, (end_date - CURRENT_DATE)) 
    INTO days_remaining
    FROM public.user_subscriptions 
    WHERE id = subscription_id AND status = 'active';
    
    -- Ενημέρωση συνδρομής σε παύση
    UPDATE public.user_subscriptions 
    SET is_paused = TRUE,
        paused_at = NOW(),
        paused_days_remaining = days_remaining
    WHERE id = subscription_id;
    
    -- Ενημέρωση κατάστασης χρήστη
    UPDATE public.app_users 
    SET subscription_status = 'inactive'
    WHERE id = (SELECT user_id FROM public.user_subscriptions WHERE id = subscription_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.resume_subscription(subscription_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    days_to_add INTEGER;
    user_uuid UUID;
BEGIN
    -- Λήψη υπόλοιπων ημερών και user_id
    SELECT paused_days_remaining, user_id 
    INTO days_to_add, user_uuid
    FROM public.user_subscriptions 
    WHERE id = subscription_id AND is_paused = TRUE;
    
    -- Ενημέρωση συνδρομής
    UPDATE public.user_subscriptions 
    SET is_paused = FALSE,
        paused_at = NULL,
        end_date = CURRENT_DATE + INTERVAL '1 day' * days_to_add,
        paused_days_remaining = NULL
    WHERE id = subscription_id;
    
    -- Ενημέρωση κατάστασης χρήστη
    UPDATE public.app_users 
    SET subscription_status = 'active'
    WHERE id = user_uuid;
END;
$function$;