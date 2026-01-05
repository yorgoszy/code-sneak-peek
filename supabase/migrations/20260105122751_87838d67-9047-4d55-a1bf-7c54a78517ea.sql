-- Update info@hyperkids.gr and yorgoszy@gmail.com to have admin's coach_id
UPDATE app_users 
SET coach_id = 'c6d44641-3b95-46bd-8270-e5ed72de25ad' 
WHERE email IN ('info@hyperkids.gr', 'yorgoszy@gmail.com');