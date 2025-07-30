-- Ενημέρωση του check constraint για το visibility πεδίο στον πίνακα offers
-- Πρώτα αφαιρούμε το παλιό constraint
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_visibility_check;

-- Προσθέτουμε το νέο constraint που περιλαμβάνει την επιλογή magic_box_losers
ALTER TABLE public.offers ADD CONSTRAINT offers_visibility_check 
CHECK (visibility IN ('all', 'individual', 'selected', 'groups', 'magic_box_losers'));