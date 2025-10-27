-- Add is_test_day and test_types columns to program_days table
ALTER TABLE program_days 
ADD COLUMN IF NOT EXISTS is_test_day boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS test_types text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN program_days.is_test_day IS 'Indicates if this day is designated as a test day';
COMMENT ON COLUMN program_days.test_types IS 'Array of test types scheduled for this day (e.g., anthropometric, functional, endurance, jump, strength)';