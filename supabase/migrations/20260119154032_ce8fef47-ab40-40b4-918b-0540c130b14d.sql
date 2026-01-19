-- Drop the existing check constraint and add a new one with muay_plam
ALTER TABLE strike_types DROP CONSTRAINT IF EXISTS strike_types_category_check;

ALTER TABLE strike_types ADD CONSTRAINT strike_types_category_check 
CHECK (category IN ('punch', 'kick', 'knee', 'elbow', 'combo', 'combo_kick_finish', 'muay_plam'));