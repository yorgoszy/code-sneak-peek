-- Διαγραφή payments που σχετίζονται με offers
DELETE FROM payments 
WHERE offer_id IS NOT NULL;

-- Διαγραφή offer rejections
DELETE FROM offer_rejections;

-- Διαγραφή offer responses
DELETE FROM offer_responses;

-- Διαγραφή acknowledged payments που σχετίζονται με offer payments
DELETE FROM acknowledged_payments 
WHERE payment_id IN (
  SELECT id FROM payments WHERE offer_id IS NOT NULL
);

-- Διαγραφή όλων των test offers
DELETE FROM offers;