CREATE TABLE public.coach_mydata_settings (
 coach_id uuid PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
 business_name text NOT NULL DEFAULT '', vat_number text NOT NULL DEFAULT '', tax_office text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '', city text NOT NULL DEFAULT '', postal_code text NOT NULL DEFAULT '', activity text NOT NULL DEFAULT '', branch integer NOT NULL DEFAULT 0,
 vat_category integer, vat_exemption_category integer, receipt_series text NOT NULL DEFAULT '', next_number bigint NOT NULL DEFAULT 1,
 enabled boolean NOT NULL DEFAULT false, connection_verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.coach_mydata_settings TO authenticated;
GRANT ALL ON public.coach_mydata_settings TO service_role;
ALTER TABLE public.coach_mydata_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages coach tax settings" ON public.coach_mydata_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.user_role));
CREATE POLICY "Coach reads own tax settings" ON public.coach_mydata_settings FOR SELECT TO authenticated USING (coach_id = public.current_app_user_id() AND public.has_role(auth.uid(), 'coach'::public.user_role));
CREATE FUNCTION public.validate_coach_mydata_settings() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.branch < 0 OR NEW.next_number < 1 THEN RAISE EXCEPTION 'Invalid branch or receipt number'; END IF;
 IF NEW.vat_category IS NOT NULL AND NEW.vat_category NOT IN (1,2,3,4,5,6,7,8) THEN RAISE EXCEPTION 'Invalid VAT category'; END IF;
 IF NEW.vat_category = 7 AND (NEW.vat_exemption_category IS NULL OR NEW.vat_exemption_category < 1) THEN RAISE EXCEPTION 'VAT exemption reason is required'; END IF;
 IF NEW.vat_category IS DISTINCT FROM 7 AND NEW.vat_exemption_category IS NOT NULL THEN RAISE EXCEPTION 'Exemption reason applies only to exempt VAT'; END IF;
 IF NEW.vat_number <> '' AND NEW.vat_number !~ '^[0-9]{9}$' THEN RAISE EXCEPTION 'AFM must have nine digits'; END IF;
 IF TG_OP = 'INSERT' OR ROW(NEW.business_name,NEW.vat_number,NEW.branch,NEW.vat_category,NEW.vat_exemption_category,NEW.receipt_series) IS DISTINCT FROM ROW(OLD.business_name,OLD.vat_number,OLD.branch,OLD.vat_category,OLD.vat_exemption_category,OLD.receipt_series) THEN NEW.connection_verified_at := NULL; NEW.enabled := false; END IF;
 IF current_user NOT IN ('postgres','service_role') AND (NEW.enabled OR NEW.connection_verified_at IS NOT NULL) THEN RAISE EXCEPTION 'Only verified server connection can enable issuance'; END IF;
 NEW.updated_at := now(); RETURN NEW;
END; $$;
CREATE TRIGGER validate_coach_mydata_settings BEFORE INSERT OR UPDATE ON public.coach_mydata_settings FOR EACH ROW EXECUTE FUNCTION public.validate_coach_mydata_settings();