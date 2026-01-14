-- 1. Προσθήκη coach_id στον πίνακα user_goals
ALTER TABLE public.user_goals 
ADD COLUMN coach_id UUID REFERENCES public.app_users(id);

-- 2. Ενημέρωση υπαρχόντων στόχων - παίρνουν το coach_id από τον user
UPDATE public.user_goals g
SET coach_id = u.coach_id
FROM public.app_users u
WHERE g.user_id = u.id AND g.coach_id IS NULL;

-- 3. Διαγραφή παλιών RLS policies
DROP POLICY IF EXISTS "Admin can view all goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.user_goals;

-- 4. Νέα RLS policies

-- Οι χρήστες βλέπουν τους δικούς τους στόχους
CREATE POLICY "Users can view their own goals" 
ON public.user_goals 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.user_id
  )
);

-- Coaches/Admins/Trainers βλέπουν τους στόχους που δημιούργησαν (βάσει coach_id)
CREATE POLICY "Coaches can view goals they created" 
ON public.user_goals 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.coach_id
  )
);

-- Admins/Trainers βλέπουν ΟΛΟΥΣ τους στόχους
CREATE POLICY "Admins can view all goals" 
ON public.user_goals 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users 
    WHERE role IN ('admin', 'trainer')
  )
);

-- Χρήστες μπορούν να δημιουργήσουν στόχους για τον εαυτό τους
CREATE POLICY "Users can create their own goals" 
ON public.user_goals 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.user_id
  )
  AND (coach_id IS NULL OR coach_id = user_id)
);

-- Coaches μπορούν να δημιουργήσουν στόχους για τους χρήστες τους
CREATE POLICY "Coaches can create goals for their users" 
ON public.user_goals 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.coach_id
  )
);

-- Χρήστες μπορούν να ενημερώσουν τους δικούς τους στόχους
CREATE POLICY "Users can update their own goals" 
ON public.user_goals 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.user_id
  )
);

-- Coaches μπορούν να ενημερώσουν τους στόχους που δημιούργησαν
CREATE POLICY "Coaches can update goals they created" 
ON public.user_goals 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.coach_id
  )
);

-- Χρήστες μπορούν να διαγράψουν τους δικούς τους στόχους
CREATE POLICY "Users can delete their own goals" 
ON public.user_goals 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.user_id
  )
);

-- Coaches μπορούν να διαγράψουν τους στόχους που δημιούργησαν
CREATE POLICY "Coaches can delete goals they created" 
ON public.user_goals 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM app_users WHERE id = user_goals.coach_id
  )
);