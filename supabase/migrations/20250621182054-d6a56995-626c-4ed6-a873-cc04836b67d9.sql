
-- Βρίσκουμε και ενημερώνουμε τον χρήστη "Λάμπης Ηλιάδης" ως inactive
UPDATE app_users 
SET 
  user_status = 'inactive',
  subscription_status = 'inactive',
  role = 'general',
  updated_at = NOW()
WHERE name ILIKE '%λάμπης%' AND name ILIKE '%ηλιάδης%';

-- Εμφανίζουμε τον ενημερωμένο χρήστη για επιβεβαίωση
SELECT id, name, email, role, user_status, subscription_status, updated_at
FROM app_users 
WHERE name ILIKE '%λάμπης%' AND name ILIKE '%ηλιάδης%';
