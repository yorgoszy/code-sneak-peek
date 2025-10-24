-- Update the training_type constraint to include 'hpr'
ALTER TABLE program_blocks
DROP CONSTRAINT IF EXISTS program_blocks_training_type_check;

ALTER TABLE program_blocks
ADD CONSTRAINT program_blocks_training_type_check 
CHECK (training_type IN ('str', 'str/spd', 'pwr', 'spd/str', 'spd', 'str/end', 'pwr/end', 'spd/end', 'end', 'hpr'));