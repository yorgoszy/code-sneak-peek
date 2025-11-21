-- Διαγραφή acknowledged_payments που αναφέρονται σε payments που δεν υπάρχουν πια
DELETE FROM acknowledged_payments 
WHERE payment_id NOT IN (SELECT id FROM payments);