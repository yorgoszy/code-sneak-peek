-- Fix exercises RLS: restrict write to admin/coach/trainer
DROP POLICY IF EXISTS "Anyone can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Anyone can update exercises" ON exercises;
DROP POLICY IF EXISTS "Anyone can delete exercises" ON exercises;
DROP POLICY IF EXISTS "Anyone can insert exercise categories" ON exercise_categories;
DROP POLICY IF EXISTS "Anyone can insert exercise to category relations" ON exercise_to_category;
DROP POLICY IF EXISTS "Anyone can delete exercise to category relations" ON exercise_to_category;

CREATE POLICY "Admins and coaches can manage exercises" ON exercises
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'trainer', 'coach')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'trainer', 'coach')
  )
);

CREATE POLICY "Admins and coaches can manage exercise categories" ON exercise_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'trainer', 'coach')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'trainer', 'coach')
  )
);

CREATE POLICY "Admins and coaches can manage exercise mappings" ON exercise_to_category
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'trainer', 'coach')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'trainer', 'coach')
  )
);

-- Fix receipts: remove misconfigured "Service role" policy
DROP POLICY IF EXISTS "Service role can manage receipts" ON receipts;

-- Fix booking_sessions: remove anon access branch
DROP POLICY IF EXISTS "Admins can view all booking sessions when not authenticated" ON booking_sessions;
CREATE POLICY "Admins can view all booking sessions" ON booking_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Fix workout_completions: remove overly permissive policy
DROP POLICY IF EXISTS "Users can manage workout completions" ON workout_completions;

-- Fix record_videocall: add access control
CREATE OR REPLACE FUNCTION public.record_videocall(
  p_user_id UUID, 
  p_created_by UUID DEFAULT NULL, 
  p_videocall_type TEXT DEFAULT 'manual', 
  p_notes TEXT DEFAULT NULL
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  videocall_id UUID;
  package_id UUID;
  caller_role TEXT;
BEGIN
  -- Verify caller is admin or coach
  SELECT role INTO caller_role
  FROM app_users
  WHERE auth_user_id = auth.uid();
  
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'coach') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and coaches can record videocalls';
  END IF;

  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Find active package
  SELECT id INTO package_id
  FROM public.videocall_packages
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND remaining_calls > 0
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
  ORDER BY purchase_date DESC
  LIMIT 1;

  -- Insert videocall record
  INSERT INTO public.user_videocalls (user_id, created_by, videocall_type, notes)
  VALUES (p_user_id, COALESCE(p_created_by, (SELECT id FROM app_users WHERE auth_user_id = auth.uid())), p_videocall_type, p_notes)
  RETURNING id INTO videocall_id;

  -- Decrement package if found
  IF package_id IS NOT NULL THEN
    UPDATE public.videocall_packages
    SET remaining_calls = remaining_calls - 1,
        updated_at = NOW()
    WHERE id = package_id;
  END IF;

  RETURN videocall_id;
END;
$$;