-- Προσθήκη στηλών στον υπάρχοντα πίνακα user_videocalls για booking functionality
ALTER TABLE public.user_videocalls 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS requested_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

-- Update existing records to have 'completed' status
UPDATE public.user_videocalls 
SET status = 'completed' 
WHERE status IS NULL;

-- Trigger function για videocall notifications (χρησιμοποιώντας user_videocalls)
CREATE OR REPLACE FUNCTION notify_videocall_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Άμεσο notification για νέες αιτήσεις (pending)
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM
      net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := json_build_object(
          'type', 'booking_pending',
          'bookingId', NEW.id,
          'adminEmail', 'yorgoszy@gmail.com'
        )::jsonb
      );
  END IF;

  -- Notifications για status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Εγκρίθηκε
    IF NEW.status = 'confirmed' THEN
      PERFORM
        net.http_post(
          url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
          body := json_build_object(
            'type', 'booking_approved',
            'bookingId', NEW.id
          )::jsonb
        );
    
    -- Απορρίφθηκε
    ELSIF NEW.status = 'rejected' THEN
      PERFORM
        net.http_post(
          url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
          body := json_build_object(
            'type', 'booking_rejected',
            'bookingId', NEW.id
          )::jsonb
        );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Δημιουργία trigger στον πίνακα user_videocalls
DROP TRIGGER IF EXISTS videocall_notification_trigger ON user_videocalls;
CREATE TRIGGER videocall_notification_trigger
  AFTER INSERT OR UPDATE ON user_videocalls
  FOR EACH ROW
  EXECUTE FUNCTION notify_videocall_changes();

-- Cron job για 24ωρη υπενθύμιση
SELECT cron.schedule(
  'videocall-reminder-24h',
  '0 12 * * *', -- κάθε μέρα στις 12:00
  $$
  SELECT
    net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'reminder_24h',
        'bookingId', uv.id
      )::jsonb
    )
  FROM user_videocalls uv
  WHERE uv.status = 'confirmed'
    AND uv.videocall_date = CURRENT_DATE + INTERVAL '1 day'
  $$
);

-- Cron job για 1ωρη υπενθύμιση  
SELECT cron.schedule(
  'videocall-reminder-1h',
  '* * * * *', -- κάθε λεπτό (θα ελέγχει για την επόμενη ώρα)
  $$
  SELECT
    net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'reminder_1h',
        'bookingId', uv.id
      )::jsonb
    )
  FROM user_videocalls uv
  WHERE uv.status = 'confirmed'
    AND uv.videocall_date = CURRENT_DATE
    AND uv.videocall_time BETWEEN (CURRENT_TIME + INTERVAL '55 minutes') AND (CURRENT_TIME + INTERVAL '65 minutes')
  $$
);

-- Cron job για 15λεπτη υπενθύμιση
SELECT cron.schedule(
  'videocall-reminder-15min',
  '* * * * *', -- κάθε λεπτό (θα ελέγχει για τα επόμενα 15 λεπτά)
  $$
  SELECT
    net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'reminder_15min',
        'bookingId', uv.id
      )::jsonb
    )
  FROM user_videocalls uv
  WHERE uv.status = 'confirmed'
    AND uv.videocall_date = CURRENT_DATE
    AND uv.videocall_time BETWEEN (CURRENT_TIME + INTERVAL '10 minutes') AND (CURRENT_TIME + INTERVAL '20 minutes')
  $$
);