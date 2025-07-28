-- Προσθήκη foreign key στον πίνακα campaign_prizes για subscription_types
ALTER TABLE campaign_prizes 
ADD CONSTRAINT fk_campaign_prizes_subscription_types 
FOREIGN KEY (subscription_type_id) 
REFERENCES subscription_types(id);