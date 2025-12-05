-- Drop the existing check constraint on training_type
ALTER TABLE public.program_blocks DROP CONSTRAINT IF EXISTS program_blocks_training_type_check;

-- Add new check constraint with ALL existing training types plus the new ones
ALTER TABLE public.program_blocks 
ADD CONSTRAINT program_blocks_training_type_check 
CHECK (training_type IS NULL OR training_type IN (
  -- Existing values from database
  'str/end',
  'activation',
  'spd/end',
  'str/spd',
  'mobility',
  'recovery',
  'hpr',
  'str',
  'pwr/end',
  'pwr',
  'stability',
  'end',
  'neural act',
  -- New values requested
  'warm up',
  'accessory',
  'rotational',
  -- Additional useful values
  'strength', 
  'power', 
  'hypertrophy', 
  'endurance', 
  'conditioning',
  'core',
  'plyometric',
  'speed',
  'agility'
));