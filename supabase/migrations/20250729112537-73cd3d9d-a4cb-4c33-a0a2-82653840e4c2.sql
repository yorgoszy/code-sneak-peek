-- Διόρθωση security warnings για τις functions
DROP TRIGGER IF EXISTS update_user_magic_boxes_updated_at ON public.user_magic_boxes;
DROP FUNCTION IF EXISTS public.update_user_magic_boxes_updated_at() CASCADE;

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

CREATE TRIGGER update_user_magic_boxes_updated_at
  BEFORE UPDATE ON public.user_magic_boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_magic_boxes_updated_at();