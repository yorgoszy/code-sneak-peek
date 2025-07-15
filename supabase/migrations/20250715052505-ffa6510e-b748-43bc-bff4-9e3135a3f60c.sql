-- Δημιουργία πίνακα για τις επισκέψεις/παρουσίες
CREATE TABLE public.user_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NULL,
  notes TEXT NULL,
  visit_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'qr_scan'
  location TEXT NULL
);

-- Δημιουργία πίνακα για visit-based subscriptions
CREATE TABLE public.visit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_visits INTEGER NOT NULL,
  remaining_visits INTEGER NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'used'
  price DECIMAL(10,2) NULL,
  payment_id UUID NULL
);

-- Προσθήκη QR code support στον πίνακα app_users
ALTER TABLE public.app_users 
ADD COLUMN qr_code TEXT NULL;

-- Ενημέρωση subscription_types για να υποστηρίζει επισκέψεις
ALTER TABLE public.subscription_types 
ADD COLUMN subscription_mode TEXT NOT NULL DEFAULT 'time_based', -- 'time_based', 'visit_based'
ADD COLUMN visit_count INTEGER NULL, -- αριθμός επισκέψεων για visit-based subscriptions
ADD COLUMN visit_expiry_months INTEGER NULL; -- μήνες λήξης για visit packages

-- Enable RLS
ALTER TABLE public.user_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies για user_visits
CREATE POLICY "Users can view their own visits" 
ON public.user_visits 
FOR SELECT 
USING (auth.uid()::text IN (
  SELECT au.auth_user_id::text 
  FROM public.app_users au 
  WHERE au.id = user_visits.user_id
) OR auth.uid()::text IN (
  SELECT au.auth_user_id::text 
  FROM public.app_users au 
  WHERE au.role = 'admin'
));

CREATE POLICY "Admins can create visits for users" 
ON public.user_visits 
FOR INSERT 
WITH CHECK (auth.uid()::text IN (
  SELECT au.auth_user_id::text 
  FROM public.app_users au 
  WHERE au.role = 'admin'
));

CREATE POLICY "Admins can update visits" 
ON public.user_visits 
FOR UPDATE 
USING (auth.uid()::text IN (
  SELECT au.auth_user_id::text 
  FROM public.app_users au 
  WHERE au.role = 'admin'
));

-- RLS Policies για visit_packages
CREATE POLICY "Users can view their own visit packages" 
ON public.visit_packages 
FOR SELECT 
USING (auth.uid()::text IN (
  SELECT au.auth_user_id::text 
  FROM public.app_users au 
  WHERE au.id = visit_packages.user_id
) OR auth.uid()::text IN (
  SELECT au.auth_user_id::text 
  FROM public.app_users au 
  WHERE au.role = 'admin'
));

CREATE POLICY "Admins can manage visit packages" 
ON public.visit_packages 
FOR ALL 
USING (auth.uid()::text IN (
  SELECT au.auth_user_id::text 
  FROM public.app_users au 
  WHERE au.role = 'admin'
));

-- Foreign Keys
ALTER TABLE public.user_visits 
ADD CONSTRAINT fk_user_visits_user_id 
FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE public.user_visits 
ADD CONSTRAINT fk_user_visits_created_by 
FOREIGN KEY (created_by) REFERENCES public.app_users(id) ON DELETE SET NULL;

ALTER TABLE public.visit_packages 
ADD CONSTRAINT fk_visit_packages_user_id 
FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE public.visit_packages 
ADD CONSTRAINT fk_visit_packages_payment_id 
FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;

-- Triggers για updated_at
CREATE TRIGGER update_visit_packages_updated_at
BEFORE UPDATE ON public.visit_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function για να δημιουργεί QR code για χρήστες
CREATE OR REPLACE FUNCTION public.generate_user_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Δημιουργία QR code με βάση το user ID
  NEW.qr_code = encode(NEW.id::text::bytea, 'base64');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger για αυτόματη δημιουργία QR code
CREATE TRIGGER generate_qr_code_trigger
BEFORE INSERT ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.generate_user_qr_code();

-- Ενημέρωση υπάρχοντων χρηστών με QR codes
UPDATE public.app_users 
SET qr_code = encode(id::text::bytea, 'base64')
WHERE qr_code IS NULL;

-- Function για καταγραφή επίσκεψης και ενημέρωση visit package
CREATE OR REPLACE FUNCTION public.record_visit(
  p_user_id UUID,
  p_created_by UUID DEFAULT NULL,
  p_visit_type TEXT DEFAULT 'manual',
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  visit_id UUID;
  package_id UUID;
BEGIN
  -- Έλεγχος για ενεργό visit package
  SELECT id INTO package_id
  FROM public.visit_packages
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND remaining_visits > 0
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
  ORDER BY purchase_date DESC
  LIMIT 1;
  
  -- Καταγραφή επίσκεψης
  INSERT INTO public.user_visits (user_id, created_by, visit_type, notes)
  VALUES (p_user_id, p_created_by, p_visit_type, p_notes)
  RETURNING id INTO visit_id;
  
  -- Ενημέρωση visit package αν υπάρχει
  IF package_id IS NOT NULL THEN
    UPDATE public.visit_packages 
    SET remaining_visits = remaining_visits - 1,
        updated_at = now(),
        status = CASE WHEN remaining_visits - 1 = 0 THEN 'used' ELSE 'active' END
    WHERE id = package_id;
  END IF;
  
  RETURN visit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes για performance
CREATE INDEX idx_user_visits_user_id ON public.user_visits(user_id);
CREATE INDEX idx_user_visits_date ON public.user_visits(visit_date);
CREATE INDEX idx_visit_packages_user_id ON public.visit_packages(user_id);
CREATE INDEX idx_visit_packages_status ON public.visit_packages(status);
CREATE INDEX idx_app_users_qr_code ON public.app_users(qr_code);

-- Προσθήκη visit-based subscription type
INSERT INTO public.subscription_types (
  name, 
  description, 
  price, 
  duration_months, 
  subscription_mode, 
  visit_count,
  visit_expiry_months,
  is_active
) VALUES (
  '10 Επισκέψεις', 
  'Πακέτο 10 επισκέψεων με διάρκεια 3 μηνών', 
  100.00, 
  0, 
  'visit_based', 
  10,
  3,
  true
);