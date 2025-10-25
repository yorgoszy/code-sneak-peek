-- Ενημέρωση του check constraint για το training_type στο program_blocks
-- Αφαιρούμε το παλιό constraint
ALTER TABLE program_blocks DROP CONSTRAINT IF EXISTS program_blocks_training_type_check;

-- Προσθέτουμε το νέο constraint με όλους τους τύπους
ALTER TABLE program_blocks ADD CONSTRAINT program_blocks_training_type_check 
CHECK (training_type IN (
  'str', 
  'str/spd', 
  'pwr', 
  'spd/str', 
  'spd', 
  'str/end', 
  'pwr/end', 
  'spd/end', 
  'end', 
  'hpr', 
  'mobility', 
  'stability', 
  'activation', 
  'neural act', 
  'recovery'
));