CREATE OR REPLACE FUNCTION public.notify_ring_youtube_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.youtube_live_url, '') IS DISTINCT FROM COALESCE(NEW.youtube_live_url, '')
       AND COALESCE(NEW.youtube_live_url, '') <> '' THEN
      PERFORM net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/notify-ring-leads',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := jsonb_build_object('event','youtube_added','competition_id',NEW.competition_id,'ring_number',NEW.ring_number,'youtube_live_url',NEW.youtube_live_url)
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.youtube_live_url, '') <> '' THEN
      PERFORM net.http_post(
        url := 'https://dicwdviufetibnafzipa.supabase.co/functions/v1/notify-ring-leads',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpY3dkdml1ZmV0aWJuYWZ6aXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTczNTAsImV4cCI6MjA2Mjk3MzM1MH0.Rlr7MWSRm1dUnXH_5xBkTNYxKBb3t8xCzwwnv1SlIs8"}'::jsonb,
        body := jsonb_build_object('event','youtube_added','competition_id',NEW.competition_id,'ring_number',NEW.ring_number,'youtube_live_url',NEW.youtube_live_url)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ring_youtube_change ON public.competition_rings;
CREATE TRIGGER trg_notify_ring_youtube_change
AFTER INSERT OR UPDATE OF youtube_live_url ON public.competition_rings
FOR EACH ROW
EXECUTE FUNCTION public.notify_ring_youtube_change();