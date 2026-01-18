-- Drop existing policies
DROP POLICY IF EXISTS "Coaches can create their own strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches can update their own strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches can delete their own strike types" ON public.strike_types;

-- Create new policies that allow both coaches and admins
CREATE POLICY "Coaches and admins can create strike types" 
ON public.strike_types 
FOR INSERT 
WITH CHECK (
  coach_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Coaches and admins can update strike types" 
ON public.strike_types 
FOR UPDATE 
USING (
  coach_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Coaches and admins can delete strike types" 
ON public.strike_types 
FOR DELETE 
USING (
  coach_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);