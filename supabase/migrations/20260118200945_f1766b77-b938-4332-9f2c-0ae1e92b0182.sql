-- Add opponent strikes and technique correctness tracking

-- Add columns for opponent strikes
ALTER TABLE muaythai_strikes 
ADD COLUMN IF NOT EXISTS is_opponent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT true;

-- Add columns for opponent defenses
ALTER TABLE muaythai_defenses
ADD COLUMN IF NOT EXISTS is_opponent BOOLEAN DEFAULT false;

-- Add opponent and correctness stats to rounds
ALTER TABLE muaythai_rounds
ADD COLUMN IF NOT EXISTS opponent_strikes_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opponent_strikes_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS athlete_strikes_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS athlete_strikes_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hits_received INTEGER DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN muaythai_strikes.is_opponent IS 'True if this strike was thrown by the opponent';
COMMENT ON COLUMN muaythai_strikes.is_correct IS 'True if the technique was executed correctly';
COMMENT ON COLUMN muaythai_rounds.hits_received IS 'Calculated: opponent strikes - athlete blocks';