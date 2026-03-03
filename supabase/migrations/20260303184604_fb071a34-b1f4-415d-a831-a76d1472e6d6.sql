-- Fix the ΔΩΚΙΜΑΣΤΙΚΟ subscription that was created with wrong end_date
UPDATE user_subscriptions 
SET end_date = '2026-04-02', status = 'active' 
WHERE id = '40ed5358-6371-4cda-b428-15bab1f7996c';