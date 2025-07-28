-- Προσθήκη unique constraint για να αποφύγουμε duplicate participations
ALTER TABLE user_campaign_participations 
ADD CONSTRAINT unique_user_campaign_participation 
UNIQUE (user_id, campaign_id);

-- Προσθήκη index για καλύτερη απόδοση
CREATE INDEX idx_user_campaign_participations_user_campaign 
ON user_campaign_participations(user_id, campaign_id);