-- Update all existing users without coach_id to have admin's ID as coach_id
-- Exclude admin and coach roles from this update
UPDATE app_users 
SET coach_id = 'c6d44641-3b95-46bd-8270-e5ed72de25ad' 
WHERE coach_id IS NULL 
  AND id != 'c6d44641-3b95-46bd-8270-e5ed72de25ad'
  AND role NOT IN ('admin', 'coach');