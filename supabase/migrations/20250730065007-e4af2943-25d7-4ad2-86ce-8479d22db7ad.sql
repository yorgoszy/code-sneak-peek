-- Ενεργοποίηση Row Level Security για user_magic_boxes
ALTER TABLE user_magic_boxes ENABLE ROW LEVEL SECURITY;

-- Policy για viewing - χρήστες μπορούν να βλέπουν τα δικά τους magic boxes
CREATE POLICY "Users can view their own magic boxes" 
ON user_magic_boxes 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM app_users 
  WHERE auth_user_id = auth.uid()
));

-- Policy για admins να βλέπουν όλα
CREATE POLICY "Admins can view all magic boxes" 
ON user_magic_boxes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() 
  AND role = 'admin'
));

-- Policy για insert - system/admin μπορούν να δημιουργούν magic boxes
CREATE POLICY "Admins can create magic boxes" 
ON user_magic_boxes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() 
  AND role = 'admin'
));

-- Policy για updates - χρήστες μπορούν να ενημερώνουν τα δικά τους magic boxes (για το άνοιγμα)
CREATE POLICY "Users can update their own magic boxes" 
ON user_magic_boxes 
FOR UPDATE 
USING (user_id IN (
  SELECT id FROM app_users 
  WHERE auth_user_id = auth.uid()
))
WITH CHECK (user_id IN (
  SELECT id FROM app_users 
  WHERE auth_user_id = auth.uid()
));

-- Policy για admins να ενημερώνουν όλα
CREATE POLICY "Admins can update all magic boxes" 
ON user_magic_boxes 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() 
  AND role = 'admin'
));

-- Policy για delete - μόνο admins
CREATE POLICY "Admins can delete magic boxes" 
ON user_magic_boxes 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() 
  AND role = 'admin'
));