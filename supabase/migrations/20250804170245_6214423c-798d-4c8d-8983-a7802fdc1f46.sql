-- Διόρθωση του trigger για να μην αντικαθιστά υπάρχοντα receipt_number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Μόνο αν δεν υπάρχει ήδη receipt_number, δημιουργούμε έναν αυτόματο
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'RCP-' || TO_CHAR(NEW.issue_date, 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM NEW.created_at)::text, 10, '0');
  END IF;
  RETURN NEW;
END;
$function$;