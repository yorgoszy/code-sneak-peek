-- Διαγραφή παλιών πινάκων magic box
DROP TABLE IF EXISTS magic_box_subscription_prizes CASCADE;
DROP TABLE IF EXISTS magic_boxes CASCADE;
DROP TABLE IF EXISTS user_magic_box_wins CASCADE;

-- Δημιουργία πίνακα discount_coupons αν δεν υπάρχει (για τα discount βραβεία)
CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  current_uses INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS για discount_coupons
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Policies για discount_coupons
CREATE POLICY "Users can view their own discount coupons" 
ON discount_coupons FOR SELECT 
USING (user_id IN (
  SELECT app_users.id FROM app_users 
  WHERE app_users.auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all discount coupons" 
ON discount_coupons FOR ALL 
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE app_users.auth_user_id = auth.uid() 
  AND app_users.role = 'admin'
));