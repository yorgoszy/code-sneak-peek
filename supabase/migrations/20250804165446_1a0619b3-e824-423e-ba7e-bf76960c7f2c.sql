-- Διόρθωση του trigger για generation receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.receipt_number := 'RCP-' || TO_CHAR(NEW.issue_date, 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM NEW.created_at)::text, 10, '0');
  RETURN NEW;
END;
$function$;