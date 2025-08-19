-- Trigger για αποστολή email notification όταν δημιουργείται νέα απόδειξη
CREATE OR REPLACE FUNCTION public.notify_receipt_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Στείλε email notification για νέα απόδειξη στον admin
  IF TG_OP = 'INSERT' THEN
    PERFORM
      net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := json_build_object(
          'type', 'receipt_created',
          'receiptId', NEW.id,
          'receiptNumber', NEW.receipt_number,
          'customerName', NEW.customer_name,
          'totalAmount', NEW.total,
          'adminEmail', 'yorgoszy@gmail.com'
        )::jsonb
      );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Δημιουργία trigger για νέες αποδείξεις
DROP TRIGGER IF EXISTS receipt_email_notification ON public.receipts;
CREATE TRIGGER receipt_email_notification
  AFTER INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.notify_receipt_email();