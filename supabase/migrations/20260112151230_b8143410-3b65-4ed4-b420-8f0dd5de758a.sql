-- Update the mydata_settings with correct credentials
UPDATE public.mydata_settings 
SET aade_user_id = '1281099090', 
    vat_number = '128109909', 
    subscription_key = '6a1bc2b0ad328f1971a203175834caa4',
    updated_at = now()
WHERE id = (SELECT id FROM public.mydata_settings LIMIT 1);