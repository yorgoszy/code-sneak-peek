-- Διαγραφή test προσφορών (payments με subscription_type_id)
DELETE FROM payments 
WHERE subscription_type_id IS NOT NULL;