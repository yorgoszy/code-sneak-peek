-- Αλλαγή του foreign key constraint για να επιτρέπει διαγραφή subscription types
-- Οι υπάρχουσες συνδρομές θα διατηρηθούν αλλά με NULL subscription_type_id

-- 1. Κάνε το subscription_type_id nullable αν δεν είναι ήδη
ALTER TABLE user_subscriptions 
  ALTER COLUMN subscription_type_id DROP NOT NULL;

-- 2. Διέγραψε το παλιό foreign key constraint
ALTER TABLE user_subscriptions 
  DROP CONSTRAINT IF EXISTS user_subscriptions_subscription_type_id_fkey;

-- 3. Δημιούργησε νέο foreign key constraint με ON DELETE SET NULL
ALTER TABLE user_subscriptions
  ADD CONSTRAINT user_subscriptions_subscription_type_id_fkey 
  FOREIGN KEY (subscription_type_id) 
  REFERENCES subscription_types(id) 
  ON DELETE SET NULL;

-- Ενημέρωση: Αφαίρεσε και τα constraints από άλλα tables που χρησιμοποιούν subscription_types

-- Payments table
ALTER TABLE payments 
  ALTER COLUMN subscription_type_id DROP NOT NULL;

ALTER TABLE payments 
  DROP CONSTRAINT IF EXISTS payments_subscription_type_id_fkey;

ALTER TABLE payments
  ADD CONSTRAINT payments_subscription_type_id_fkey 
  FOREIGN KEY (subscription_type_id) 
  REFERENCES subscription_types(id) 
  ON DELETE SET NULL;

-- Offers table
ALTER TABLE offers 
  DROP CONSTRAINT IF EXISTS offers_subscription_type_id_fkey;

ALTER TABLE offers
  ADD CONSTRAINT offers_subscription_type_id_fkey 
  FOREIGN KEY (subscription_type_id) 
  REFERENCES subscription_types(id) 
  ON DELETE SET NULL;

-- Campaign prizes table
ALTER TABLE campaign_prizes 
  DROP CONSTRAINT IF EXISTS campaign_prizes_subscription_type_id_fkey;

ALTER TABLE campaign_prizes
  ADD CONSTRAINT campaign_prizes_subscription_type_id_fkey 
  FOREIGN KEY (subscription_type_id) 
  REFERENCES subscription_types(id) 
  ON DELETE SET NULL;