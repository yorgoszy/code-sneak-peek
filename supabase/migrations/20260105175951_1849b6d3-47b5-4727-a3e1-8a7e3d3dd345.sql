-- Μετατροπή power σε pwr
UPDATE public.program_blocks SET training_type = 'pwr' WHERE training_type = 'power';

-- Μετατροπή hypertrophy σε hpr
UPDATE public.program_blocks SET training_type = 'hpr' WHERE training_type = 'hypertrophy';

-- Μετατροπή activation, mobility, neural act, stability σε NULL
UPDATE public.program_blocks SET training_type = NULL WHERE training_type IN ('activation', 'mobility', 'neural act', 'stability');

-- Ενημέρωση του constraint για τα επιτρεπόμενα training_type
ALTER TABLE public.program_blocks DROP CONSTRAINT IF EXISTS program_blocks_training_type_check;

ALTER TABLE public.program_blocks ADD CONSTRAINT program_blocks_training_type_check 
CHECK (training_type IS NULL OR training_type IN (
  'warm up',
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
  'recovery',
  'accessory',
  'rotational'
));