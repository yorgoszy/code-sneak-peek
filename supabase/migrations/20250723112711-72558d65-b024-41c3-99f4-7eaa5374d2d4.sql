-- Δημιουργία πίνακα για videocall packages
CREATE TABLE IF NOT EXISTS public.videocall_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_videocalls INTEGER NOT NULL,
  remaining_videocalls INTEGER NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  price NUMERIC,
  payment_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Δημιουργία πίνακα για videocall visits
CREATE TABLE IF NOT EXISTS public.user_videocalls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  videocall_date DATE NOT NULL DEFAULT CURRENT_DATE,
  videocall_time TIME NOT NULL DEFAULT '00:00',
  videocall_type TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ενεργοποίηση RLS
ALTER TABLE public.videocall_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_videocalls ENABLE ROW LEVEL SECURITY;

-- Policies για videocall_packages
CREATE POLICY "Admins can manage videocall packages" 
ON public.videocall_packages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own videocall packages" 
ON public.videocall_packages 
FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT au.auth_user_id::text 
    FROM app_users au 
    WHERE au.id = videocall_packages.user_id
  ) OR 
  auth.uid()::text IN (
    SELECT au.auth_user_id::text 
    FROM app_users au 
    WHERE au.role = 'admin'
  )
);

-- Policies για user_videocalls
CREATE POLICY "Admins can manage videocalls" 
ON public.user_videocalls 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can view their own videocalls" 
ON public.user_videocalls 
FOR SELECT 
USING (
  auth.uid()::text IN (
    SELECT au.auth_user_id::text 
    FROM app_users au 
    WHERE au.id = user_videocalls.user_id
  ) OR 
  auth.uid()::text IN (
    SELECT au.auth_user_id::text 
    FROM app_users au 
    WHERE au.role = 'admin'
  )
);

-- Συνάρτηση για καταγραφή videocall
CREATE OR REPLACE FUNCTION public.record_videocall(
  p_user_id UUID, 
  p_created_by UUID DEFAULT NULL, 
  p_videocall_type TEXT DEFAULT 'manual', 
  p_notes TEXT DEFAULT NULL
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  videocall_id UUID;
  package_id UUID;
BEGIN
  -- Έλεγχος για ενεργό videocall package
  SELECT id INTO package_id
  FROM public.videocall_packages
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND remaining_videocalls > 0
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
  ORDER BY purchase_date DESC
  LIMIT 1;
  
  -- Καταγραφή videocall
  INSERT INTO public.user_videocalls (user_id, created_by, videocall_type, notes)
  VALUES (p_user_id, p_created_by, p_videocall_type, p_notes)
  RETURNING id INTO videocall_id;
  
  -- Ενημέρωση videocall package αν υπάρχει
  IF package_id IS NOT NULL THEN
    UPDATE public.videocall_packages 
    SET remaining_videocalls = remaining_videocalls - 1,
        updated_at = now(),
        status = CASE WHEN remaining_videocalls - 1 = 0 THEN 'used' ELSE 'active' END
    WHERE id = package_id;
  END IF;
  
  RETURN videocall_id;
END;
$$;