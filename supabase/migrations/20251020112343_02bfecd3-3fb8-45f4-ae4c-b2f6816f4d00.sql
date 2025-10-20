-- Add new columns to anthropometric_test_data table
ALTER TABLE anthropometric_test_data
ADD COLUMN IF NOT EXISTS visceral_fat_percentage numeric,
ADD COLUMN IF NOT EXISTS bone_density numeric;