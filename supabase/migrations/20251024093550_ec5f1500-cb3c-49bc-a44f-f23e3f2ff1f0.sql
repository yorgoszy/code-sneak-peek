-- Add kg_mode column to program_exercises table
ALTER TABLE program_exercises
ADD COLUMN IF NOT EXISTS kg_mode TEXT CHECK (kg_mode IN ('kg', 'rpm', 'meter', 's/m', 'km/h'));