
-- Διαγραφή υπαρχουσών policies για τον πίνακα ai_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Admins can manage all conversations" ON public.ai_conversations;

-- Νέες RLS policies για ai_conversations
-- Οι χρήστες μπορούν να βλέπουν τις δικές τους συνομιλίες
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

-- Οι χρήστες μπορούν να εισάγουν μηνύματα στις δικές τους συνομιλίες
CREATE POLICY "Users can insert their own conversations" ON public.ai_conversations
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

-- Οι admins μπορούν να βλέπουν όλες τις συνομιλίες
CREATE POLICY "Admins can view all conversations" ON public.ai_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Οι admins μπορούν να διαχειρίζονται όλες τις συνομιλίες
CREATE POLICY "Admins can manage all conversations" ON public.ai_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ενημέρωση policies για ai_user_profiles
DROP POLICY IF EXISTS "Users can view their own ai profile" ON public.ai_user_profiles;
DROP POLICY IF EXISTS "Users can update their own ai profile" ON public.ai_user_profiles;
DROP POLICY IF EXISTS "Users can insert their own ai profile" ON public.ai_user_profiles;
DROP POLICY IF EXISTS "Admins can manage all ai profiles" ON public.ai_user_profiles;

-- Νέες policies για ai_user_profiles
CREATE POLICY "Users can view their own ai profile" ON public.ai_user_profiles
  FOR SELECT USING (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own ai profile" ON public.ai_user_profiles
  FOR UPDATE USING (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own ai profile" ON public.ai_user_profiles
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all ai profiles" ON public.ai_user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
