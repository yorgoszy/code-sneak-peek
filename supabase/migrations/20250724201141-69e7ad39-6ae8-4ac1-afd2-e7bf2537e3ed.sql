-- Ενημέρωση cron jobs για αποστολή υπενθυμίσεων σε χρήστη και admin

-- Διαγραφή υπαρχόντων cron jobs
SELECT cron.unschedule('videocall-reminder-24h');
SELECT cron.unschedule('videocall-reminder-1h');
SELECT cron.unschedule('videocall-reminder-15min');

-- Δημιουργία function για υπενθυμίσεις χρήστη και admin
CREATE OR REPLACE FUNCTION send_videocall_reminders(reminder_type text, time_window_start interval, time_window_end interval)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    booking RECORD;
BEGIN
    FOR booking IN
        SELECT bs.id, au.email as user_email
        FROM booking_sessions bs
        JOIN app_users au ON bs.user_id = au.id
        WHERE bs.booking_type = 'videocall'
          AND bs.status = 'confirmed'
          AND (
            (reminder_type = 'reminder_24h' AND bs.booking_date = CURRENT_DATE + INTERVAL '1 day') OR
            (reminder_type != 'reminder_24h' AND (bs.booking_date + bs.booking_time)::timestamp 
             BETWEEN (NOW() + time_window_start) AND (NOW() + time_window_end))
          )
    LOOP
        -- Email σε χρήστη
        PERFORM net.http_post(
            url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
            body := json_build_object(
                'type', reminder_type,
                'bookingId', booking.id
            )::jsonb
        );
        
        -- Email σε admin
        PERFORM net.http_post(
            url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-videocall-notifications',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
            body := json_build_object(
                'type', reminder_type,
                'bookingId', booking.id,
                'adminEmail', 'yorgoszy@gmail.com'
            )::jsonb
        );
    END LOOP;
END;
$$;

-- Υπενθύμιση 24 ώρες πριν (σε χρήστη και admin)
SELECT cron.schedule(
    'videocall-reminder-24h',
    '0 9 * * *', -- Κάθε μέρα στις 9:00
    'SELECT send_videocall_reminders(''reminder_24h'', NULL, NULL);'
);

-- Υπενθύμιση 1 ώρα πριν (σε χρήστη και admin)
SELECT cron.schedule(
    'videocall-reminder-1h',
    '* * * * *', -- Κάθε λεπτό
    'SELECT send_videocall_reminders(''reminder_1h'', INTERVAL ''55 minutes'', INTERVAL ''65 minutes'');'
);

-- Υπενθύμιση 15 λεπτά πριν (σε χρήστη και admin)
SELECT cron.schedule(
    'videocall-reminder-15min',
    '* * * * *', -- Κάθε λεπτό
    'SELECT send_videocall_reminders(''reminder_15min'', INTERVAL ''10 minutes'', INTERVAL ''20 minutes'');'
);