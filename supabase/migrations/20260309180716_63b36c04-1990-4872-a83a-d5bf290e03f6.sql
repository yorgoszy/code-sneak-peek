-- Set default registration fee to 50€ for all categories that don't have one
UPDATE federation_competition_categories 
SET registration_fee = 50 
WHERE registration_fee IS NULL;