-- Δημιουργία cron job για καθημερινό έλεγχο missed workouts
-- Τρέχει κάθε μέρα στις 00:05 (5 λεπτά μετά τα μεσάνυχτα)
SELECT cron.schedule(
    'daily-missed-workouts-check',
    '5 0 * * *',
    $$
    SELECT net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/mark-missed-workouts',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := concat('{"timestamp": "', now(), '"}')::jsonb
    ) AS request_id;
    $$
);