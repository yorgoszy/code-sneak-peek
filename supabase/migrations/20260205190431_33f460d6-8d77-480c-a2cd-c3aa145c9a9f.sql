-- Add fields for sellable program templates
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_sellable boolean DEFAULT false;

-- Create table for program purchases
CREATE TABLE IF NOT EXISTS program_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES app_users(id),
  amount_paid numeric NOT NULL,
  stripe_session_id text,
  training_days text[] NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  purchased_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE program_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for program_purchases
CREATE POLICY "Users can view their own purchases"
ON program_purchases FOR SELECT
USING (user_id = get_app_user_id_safe(auth.uid()));

CREATE POLICY "Coaches can view purchases of their programs"
ON program_purchases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM programs p 
    WHERE p.id = program_id 
    AND p.created_by = get_app_user_id_safe(auth.uid())
  )
);

CREATE POLICY "Admins can manage all purchases"
ON program_purchases FOR ALL
USING (is_admin_safe(auth.uid()));

CREATE POLICY "System can insert purchases"
ON program_purchases FOR INSERT
WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_program_purchases_user ON program_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_program_purchases_program ON program_purchases(program_id);
CREATE INDEX IF NOT EXISTS idx_programs_sellable ON programs(is_sellable) WHERE is_sellable = true;