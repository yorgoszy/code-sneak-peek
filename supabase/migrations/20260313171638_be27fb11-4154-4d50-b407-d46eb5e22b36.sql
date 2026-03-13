
-- Function to auto-update competition statuses based on registration_deadline date
CREATE OR REPLACE FUNCTION public.auto_update_competition_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comp RECORD;
BEGIN
  -- Auto-activate: upcoming competitions where registration_deadline has arrived or passed
  FOR comp IN
    SELECT id, name, federation_id
    FROM federation_competitions
    WHERE status = 'upcoming'
      AND registration_deadline IS NOT NULL
      AND registration_deadline::date <= CURRENT_DATE
  LOOP
    UPDATE federation_competitions
    SET status = 'active', updated_at = NOW()
    WHERE id = comp.id;

    -- Send notification to edge function for email to coaches
    PERFORM net.http_post(
      url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/send-competition-status-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
      body := json_build_object(
        'type', 'competition_activated',
        'competitionId', comp.id,
        'competitionName', comp.name,
        'federationId', comp.federation_id
      )::jsonb
    );
  END LOOP;

  -- Auto-complete: active competitions where competition_date (or end_date) has passed
  UPDATE federation_competitions
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'active'
    AND COALESCE(end_date, competition_date)::date < CURRENT_DATE;
END;
$$;
