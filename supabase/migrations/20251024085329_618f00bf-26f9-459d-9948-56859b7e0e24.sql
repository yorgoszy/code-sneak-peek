-- Add training_type column to program_blocks
ALTER TABLE program_blocks 
ADD COLUMN training_type TEXT CHECK (training_type IN ('str', 'str/spd', 'pwr', 'spd/str', 'spd', 'str/end', 'pwr/end', 'spd/end', 'end'));

-- Create index for better query performance
CREATE INDEX idx_program_blocks_training_type ON program_blocks(training_type);