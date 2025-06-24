
-- Ενημέρωση του subscription_status στον app_users βάσει των ενεργών συνδρομών
UPDATE public.app_users 
SET subscription_status = 'active'
WHERE id IN (
  SELECT DISTINCT us.user_id 
  FROM public.user_subscriptions us
  WHERE us.status = 'active' 
    AND us.end_date >= CURRENT_DATE
);

-- Ενημέρωση όλων των υπολοίπων σε inactive (όσων δεν έχουν ενεργή συνδρομή)
UPDATE public.app_users 
SET subscription_status = 'inactive'
WHERE id NOT IN (
  SELECT DISTINCT us.user_id 
  FROM public.user_subscriptions us
  WHERE us.status = 'active' 
    AND us.end_date >= CURRENT_DATE
);
