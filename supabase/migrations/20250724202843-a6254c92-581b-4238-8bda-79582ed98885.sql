-- ================================================
-- EMAIL NOTIFICATION TRIGGERS
-- ================================================

-- 1. TRIGGER ΓΙΑ ΕΓΓΡΑΦΗ ΝΕΟΥ ΧΡΗΣΤΗ (welcome + admin notification)
CREATE OR REPLACE FUNCTION public.notify_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send welcome email to user
  PERFORM net.http_post(
    url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
    body := json_build_object(
      'type', 'user_welcome',
      'userId', NEW.id
    )::jsonb
  );
  
  -- Send admin notification
  PERFORM net.http_post(
    url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
    body := json_build_object(
      'type', 'user_welcome_admin',
      'userId', NEW.id
    )::jsonb
  );
  
  RETURN NEW;
END;
$function$;

-- Trigger για νέους χρήστες
CREATE TRIGGER trigger_new_user_registration
  AFTER INSERT ON public.app_users
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_new_user_registration();

-- ================================================
-- 2. ENHANCED BOOKING NOTIFICATIONS
-- ================================================

-- Update existing booking trigger to handle visit bookings
CREATE OR REPLACE FUNCTION public.notify_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Νέα κράτηση επίσκεψης
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.booking_type = 'gym_visit' THEN
    -- Email confirmation to user
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_created',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );
    
    -- Admin notification for new booking
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_admin_notification',
        'userId', NEW.user_id
      )::jsonb
    );
  END IF;

  -- Ακύρωση κράτησης επίσκεψης
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' AND NEW.booking_type = 'gym_visit' THEN
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_cancelled',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ================================================
-- 3. PAYMENT/PACKAGE PURCHASE NOTIFICATIONS
-- ================================================

-- Enhanced payment notification trigger
CREATE OR REPLACE FUNCTION public.notify_payment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Όταν ολοκληρώνεται πληρωμή
  IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- User receipt notification
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'package_receipt',
        'userId', NEW.user_id,
        'paymentId', NEW.id::text
      )::jsonb
    );
    
    -- Admin notification
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'package_purchase_admin',
        'userId', NEW.user_id,
        'paymentId', NEW.id::text
      )::jsonb
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ================================================
-- 4. OFFER NOTIFICATIONS
-- ================================================

-- Trigger για νέες προσφορές (notification στον χρήστη)
CREATE OR REPLACE FUNCTION public.notify_offer_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  -- Αν η προσφορά είναι για συγκεκριμένους χρήστες
  IF NEW.visibility = 'individual' AND NEW.target_users IS NOT NULL THEN
    -- Στείλε email σε κάθε target user
    FOREACH target_user_id IN ARRAY NEW.target_users
    LOOP
      PERFORM net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := json_build_object(
          'type', 'offer_notification',
          'userId', target_user_id,
          'offerId', NEW.id::text
        )::jsonb
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger για νέες προσφορές
CREATE TRIGGER trigger_offer_created
  AFTER INSERT ON public.offers
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_offer_created();

-- Enhanced offer response triggers με admin notifications
CREATE OR REPLACE FUNCTION public.notify_offer_responses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Νέα αποδοχή προσφοράς
  IF TG_OP = 'INSERT' THEN
    -- User confirmation
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'offer_accepted',
        'userId', NEW.user_id,
        'offerId', NEW.offer_id::text
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Enhanced offer rejection trigger με admin notifications  
CREATE OR REPLACE FUNCTION public.notify_offer_rejections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- User rejection confirmation
  PERFORM net.http_post(
    url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
    body := json_build_object(
      'type', 'offer_rejected',
      'userId', NEW.user_id,
      'offerId', NEW.offer_id::text
    )::jsonb
  );
  
  RETURN NEW;
END;
$function$;