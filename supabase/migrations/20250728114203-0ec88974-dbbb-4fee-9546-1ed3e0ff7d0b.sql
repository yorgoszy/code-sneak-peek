-- Fix function search path for security
CREATE OR REPLACE FUNCTION generate_coupon_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code_length integer := 8;
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists, if so generate a new one
  WHILE EXISTS (SELECT 1 FROM public.discount_coupons WHERE code = result) LOOP
    result := '';
    FOR i IN 1..code_length LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$;