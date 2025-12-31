-- Δημιουργία της άσκησης Track αν δεν υπάρχει
INSERT INTO exercises (name, description)
SELECT 'Track', 'Sprint στην πίστα'
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE LOWER(name) = 'track');