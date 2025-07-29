-- Διόρθωση security warnings για τις functions που δημιούργησα
DROP FUNCTION IF EXISTS public.update_user_magic_boxes_updated_at();

CREATE OR REPLACE FUNCTION public.update_user_magic_boxes_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;