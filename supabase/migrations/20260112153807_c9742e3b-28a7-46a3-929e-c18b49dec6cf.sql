-- Update MyData settings with correct credentials
UPDATE public.mydata_settings
SET 
  aade_user_id = '128109909',
  subscription_key = '63fce77cf5d04aa3ab7decfae9e9bc12',
  updated_at = now()
WHERE vat_number = '128109909';