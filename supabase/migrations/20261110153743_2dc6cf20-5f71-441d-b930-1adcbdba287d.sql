DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.save_admin_section_assignment(uuid,uuid,jsonb)'::regprocedure) INTO definition;
 IF position('AND is_active AND booking_type=''gym_visit'' FOR UPDATE' in definition) = 0 THEN
  RAISE EXCEPTION 'Unexpected assignment validation definition';
 END IF;
 definition := replace(definition, 'AND is_active AND booking_type=''gym_visit'' FOR UPDATE', 'AND is_active AND (booking_type IS NULL OR booking_type=''gym_visit'') FOR UPDATE');
 EXECUTE definition;
END;
$migration$;