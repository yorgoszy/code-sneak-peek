-- ========================================
-- Λύση 1: Όλοι οι αθλητές στο app_users
-- ========================================

-- 1. Καθαρισμός coach_users (μόνο 1 εγγραφή)
DELETE FROM coach_users;

-- 2. Προσθήκη νέων columns στο app_users για coach athletes
-- Τα περισσότερα υπάρχουν ήδη, ελέγχουμε τα notes
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS notes text;

-- 3. Update RLS policies για app_users ώστε οι coaches να μπορούν να διαχειρίζονται τους δικούς τους αθλητές
-- Αυτές οι policies ήδη υπάρχουν σύμφωνα με το schema

-- 4. Αλλαγή coach_subscriptions για να δείχνει σε app_users αντί για coach_users
-- Προσθήκη νέου column user_id (θα αντικαταστήσει το coach_user_id σταδιακά)
ALTER TABLE coach_subscriptions 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;

-- 5. Αλλαγή coach_receipts 
ALTER TABLE coach_receipts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;

-- 6. Αλλαγή coach test sessions tables
ALTER TABLE coach_strength_test_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE coach_endurance_test_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE coach_jump_test_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE coach_anthropometric_test_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE coach_functional_test_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_app_users_coach_id ON app_users(coach_id);

-- 8. RLS policy για coaches να βλέπουν τους δικούς τους αθλητές στα coach tables μέσω user_id
-- Πρώτα διαγράφουμε τυχόν υπάρχουσες policies με τα ίδια ονόματα
DROP POLICY IF EXISTS "coach_subscriptions_user_id_select" ON coach_subscriptions;
DROP POLICY IF EXISTS "coach_subscriptions_user_id_insert" ON coach_subscriptions;
DROP POLICY IF EXISTS "coach_subscriptions_user_id_update" ON coach_subscriptions;
DROP POLICY IF EXISTS "coach_subscriptions_user_id_delete" ON coach_subscriptions;

-- Νέες policies για coach_subscriptions με user_id
CREATE POLICY "coach_subscriptions_user_id_select" ON coach_subscriptions
  FOR SELECT USING (
    coach_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "coach_subscriptions_user_id_insert" ON coach_subscriptions
  FOR INSERT WITH CHECK (
    coach_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "coach_subscriptions_user_id_update" ON coach_subscriptions
  FOR UPDATE USING (
    coach_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "coach_subscriptions_user_id_delete" ON coach_subscriptions
  FOR DELETE USING (
    coach_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );