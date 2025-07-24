-- Triggers για ολοκληρωμένο email notification system

-- 1. Welcome email για νέους χρήστες
CREATE OR REPLACE FUNCTION notify_user_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
    body := json_build_object(
      'type', 'user_welcome',
      'userId', NEW.id
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Trigger για welcome email όταν δημιουργείται νέος χρήστης
CREATE OR REPLACE TRIGGER trigger_user_welcome
  AFTER INSERT ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_welcome();

-- 2. Booking notifications για gym επισκέψεις
CREATE OR REPLACE FUNCTION notify_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Νέα κράτηση
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.booking_type = 'gym_visit' THEN
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'booking_created',
        'userId', NEW.user_id,
        'bookingId', NEW.id::text
      )::jsonb
    );
  END IF;

  -- Ακύρωση κράτησης
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
$$;

-- Trigger για booking changes
CREATE OR REPLACE TRIGGER trigger_booking_notifications
  AFTER INSERT OR UPDATE ON booking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_changes();

-- 3. Payment notifications για αγορά πακέτων
CREATE OR REPLACE FUNCTION notify_payment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Όταν ολοκληρώνεται πληρωμή
  IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'package_purchased',
        'userId', NEW.user_id,
        'paymentId', NEW.id::text
      )::jsonb
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger για payment completions
CREATE OR REPLACE TRIGGER trigger_payment_notifications
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_completed();

-- 4. Offer notifications για αποδοχή/απόρριψη προσφορών
CREATE OR REPLACE FUNCTION notify_offer_responses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Νέα αποδοχή προσφοράς
  IF TG_OP = 'INSERT' THEN
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
$$;

-- Trigger για user subscriptions (όταν κάποιος αγοράζει προσφορά)
CREATE OR REPLACE TRIGGER trigger_offer_accepted
  AFTER INSERT ON user_subscriptions
  FOR EACH ROW
  WHEN (NEW.notes LIKE '%offer%' OR NEW.notes LIKE '%προσφορά%')
  EXECUTE FUNCTION notify_offer_responses();

-- 5. Offer rejection notifications
CREATE OR REPLACE FUNCTION notify_offer_rejections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
$$;

-- Trigger για offer rejections
CREATE OR REPLACE TRIGGER trigger_offer_rejections
  AFTER INSERT ON offer_rejections
  FOR EACH ROW
  EXECUTE FUNCTION notify_offer_rejections();