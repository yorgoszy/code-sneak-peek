ALTER TABLE public.coach_receipts ADD COLUMN customer_name text, ADD COLUMN customer_email text, ADD COLUMN subscription_type_name text;
UPDATE public.coach_receipts r SET customer_name=COALESCE(u.name,cu.name),customer_email=COALESCE(u.email,cu.email),subscription_type_name=st.name FROM public.coach_receipts source LEFT JOIN public.app_users u ON u.id=source.user_id LEFT JOIN public.coach_users cu ON cu.id=source.coach_user_id LEFT JOIN public.subscription_types st ON st.id=source.subscription_type_id WHERE r.id=source.id;
CREATE OR REPLACE FUNCTION public.snapshot_coach_receipt_details() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE recipient_name text; recipient_email text; type_name text;
BEGIN
 SELECT name,email INTO recipient_name,recipient_email FROM public.app_users WHERE id=NEW.user_id;
 IF recipient_name IS NULL THEN SELECT name,email INTO recipient_name,recipient_email FROM public.coach_users WHERE id=NEW.coach_user_id; END IF;
 SELECT name INTO type_name FROM public.subscription_types WHERE id=NEW.subscription_type_id;
 NEW.customer_name=COALESCE(NEW.customer_name,recipient_name);
 NEW.customer_email=COALESCE(NEW.customer_email,recipient_email);
 NEW.subscription_type_name=COALESCE(NEW.subscription_type_name,type_name);
 RETURN NEW;
END $$;
CREATE TRIGGER snapshot_coach_receipt_details BEFORE INSERT OR UPDATE ON public.coach_receipts FOR EACH ROW EXECUTE FUNCTION public.snapshot_coach_receipt_details();
ALTER TABLE public.coach_receipts ALTER COLUMN coach_id DROP NOT NULL;
ALTER TABLE public.coach_receipts DROP CONSTRAINT coach_receipts_user_id_fkey, DROP CONSTRAINT coach_receipts_coach_id_fkey, DROP CONSTRAINT coach_receipts_coach_user_id_fkey, DROP CONSTRAINT coach_receipts_subscription_id_fkey, DROP CONSTRAINT coach_receipts_subscription_type_id_fkey;
ALTER TABLE public.coach_receipts ADD CONSTRAINT coach_receipts_user_id_fkey FOREIGN KEY(user_id) REFERENCES public.app_users(id) ON DELETE SET NULL, ADD CONSTRAINT coach_receipts_coach_id_fkey FOREIGN KEY(coach_id) REFERENCES public.app_users(id) ON DELETE SET NULL, ADD CONSTRAINT coach_receipts_coach_user_id_fkey FOREIGN KEY(coach_user_id) REFERENCES public.coach_users(id) ON DELETE SET NULL, ADD CONSTRAINT coach_receipts_subscription_id_fkey FOREIGN KEY(subscription_id) REFERENCES public.coach_subscriptions(id) ON DELETE SET NULL, ADD CONSTRAINT coach_receipts_subscription_type_id_fkey FOREIGN KEY(subscription_type_id) REFERENCES public.subscription_types(id) ON DELETE SET NULL;
ALTER TABLE public.receipts DROP CONSTRAINT receipts_user_id_fkey, DROP CONSTRAINT receipts_payment_id_fkey;
ALTER TABLE public.receipts ADD CONSTRAINT receipts_user_id_fkey FOREIGN KEY(user_id) REFERENCES public.app_users(id) ON DELETE SET NULL, ADD CONSTRAINT receipts_payment_id_fkey FOREIGN KEY(payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
DO $$
DECLARE definition text; function_name text;
BEGIN
 FOREACH function_name IN ARRAY ARRAY['force_delete_athlete','admin_delete_athlete_memberships'] LOOP
  SELECT pg_get_functiondef(p.oid) INTO STRICT definition FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname=function_name;
  definition=regexp_replace(definition,'DELETE FROM public\.(coach_receipts|receipts) WHERE[^;]+;','','g');
  IF definition ~ 'DELETE FROM public\.(coach_receipts|receipts)' THEN RAISE EXCEPTION 'Receipt removal still exists in %',function_name; END IF;
  EXECUTE definition;
 END LOOP;
END $$;