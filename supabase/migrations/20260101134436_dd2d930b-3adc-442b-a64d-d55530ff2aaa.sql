-- Security linter fix: set immutable search_path on function
CREATE OR REPLACE FUNCTION public.update_exercise_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;