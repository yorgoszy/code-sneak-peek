-- Create RLS policies for booking_sessions table
-- Allow users to view their own bookings and admins to view all bookings
CREATE POLICY "Users can view their own bookings"
ON public.booking_sessions
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.app_users 
    WHERE role = 'admin'
  )
);

-- Allow users to insert their own bookings
CREATE POLICY "Users can create their own bookings"
ON public.booking_sessions
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Allow users to update their own bookings and admins to update all bookings
CREATE POLICY "Users can update their own bookings"
ON public.booking_sessions
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.app_users 
    WHERE role = 'admin'
  )
);

-- Allow users to delete their own bookings and admins to delete all bookings
CREATE POLICY "Users can delete their own bookings"
ON public.booking_sessions
FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.app_users 
    WHERE role = 'admin'
  )
);