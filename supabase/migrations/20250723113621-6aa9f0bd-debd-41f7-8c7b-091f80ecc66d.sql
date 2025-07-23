-- Προσθήκη foreign key constraints για τους νέους πίνακες
ALTER TABLE public.user_videocalls 
ADD CONSTRAINT fk_user_videocalls_user_id 
FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

ALTER TABLE public.videocall_packages 
ADD CONSTRAINT fk_videocall_packages_user_id 
FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

-- Προσθήκη search_path στη συνάρτηση record_videocall
CREATE OR REPLACE FUNCTION public.record_videocall(
  p_user_id UUID, 
  p_created_by UUID DEFAULT NULL, 
  p_videocall_type TEXT DEFAULT 'manual', 
  p_notes TEXT DEFAULT NULL
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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