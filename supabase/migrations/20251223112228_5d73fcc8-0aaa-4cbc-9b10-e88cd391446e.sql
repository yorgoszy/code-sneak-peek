-- Add training philosophy field to store phase-specific training logic
ALTER TABLE training_phase_config 
ADD COLUMN training_philosophy TEXT DEFAULT NULL;

-- Add a comment to explain the field
COMMENT ON COLUMN training_phase_config.training_philosophy IS 'Stores the training philosophy/logic for the phase (e.g., circuit structure, complementary exercise categories)';