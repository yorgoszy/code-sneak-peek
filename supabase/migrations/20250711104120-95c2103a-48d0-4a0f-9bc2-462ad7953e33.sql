-- Προσθήκη νέων στηλών για pause/resume λειτουργικότητα
ALTER TABLE public.user_subscriptions 
ADD COLUMN is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN paused_days_remaining INTEGER NULL;

-- Συγχρονισμός του subscription_status στον app_users με βάση τις ενεργές συνδρομές
UPDATE public.app_users 
SET subscription_status = 'active'
WHERE id IN (
  SELECT DISTINCT us.user_id 
  FROM public.user_subscriptions us
  WHERE us.status = 'active' 
    AND us.end_date >= CURRENT_DATE
    AND (us.is_paused IS FALSE OR us.is_paused IS NULL)
);

-- Ενημέρωση όλων των υπολοίπων σε inactive
UPDATE public.app_users 
SET subscription_status = 'inactive'
WHERE id NOT IN (
  SELECT DISTINCT us.user_id 
  FROM public.user_subscriptions us
  WHERE us.status = 'active' 
    AND us.end_date >= CURRENT_DATE
    AND (us.is_paused IS FALSE OR us.is_paused IS NULL)
);

-- Δημιουργία function για παύση συνδρομής
CREATE OR REPLACE FUNCTION pause_subscription(subscription_id UUID)
RETURNS VOID AS $$
DECLARE
    days_remaining INTEGER;
BEGIN
    -- Υπολογισμός υπόλοιπων ημερών
    SELECT GREATEST(0, (end_date - CURRENT_DATE)) 
    INTO days_remaining
    FROM public.user_subscriptions 
    WHERE id = subscription_id AND status = 'active';
    
    -- Ενημέρωση συνδρομής σε παύση
    UPDATE public.user_subscriptions 
    SET is_paused = TRUE,
        paused_at = NOW(),
        paused_days_remaining = days_remaining
    WHERE id = subscription_id;
    
    -- Ενημέρωση κατάστασης χρήστη
    UPDATE public.app_users 
    SET subscription_status = 'inactive'
    WHERE id = (SELECT user_id FROM public.user_subscriptions WHERE id = subscription_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Δημιουργία function για συνέχιση συνδρομής
CREATE OR REPLACE FUNCTION resume_subscription(subscription_id UUID)
RETURNS VOID AS $$
DECLARE
    days_to_add INTEGER;
    user_uuid UUID;
BEGIN
    -- Λήψη υπόλοιπων ημερών και user_id
    SELECT paused_days_remaining, user_id 
    INTO days_to_add, user_uuid
    FROM public.user_subscriptions 
    WHERE id = subscription_id AND is_paused = TRUE;
    
    -- Ενημέρωση συνδρομής
    UPDATE public.user_subscriptions 
    SET is_paused = FALSE,
        paused_at = NULL,
        end_date = CURRENT_DATE + INTERVAL '1 day' * days_to_add,
        paused_days_remaining = NULL
    WHERE id = subscription_id;
    
    -- Ενημέρωση κατάστασης χρήστη
    UPDATE public.app_users 
    SET subscription_status = 'active'
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Δημιουργία function για ανανέωση συνδρομής
CREATE OR REPLACE FUNCTION renew_subscription(original_subscription_id UUID)
RETURNS UUID AS $$
DECLARE
    original_sub RECORD;
    new_start_date DATE;
    new_subscription_id UUID;
BEGIN
    -- Λήψη στοιχείων αρχικής συνδρομής
    SELECT user_id, subscription_type_id, end_date, status
    INTO original_sub
    FROM public.user_subscriptions 
    WHERE id = original_subscription_id;
    
    -- Καθορισμός ημερομηνίας έναρξης νέας συνδρομής
    IF original_sub.end_date >= CURRENT_DATE THEN
        new_start_date := original_sub.end_date + INTERVAL '1 day';
    ELSE
        new_start_date := CURRENT_DATE;
    END IF;
    
    -- Δημιουργία νέας συνδρομής
    INSERT INTO public.user_subscriptions (
        user_id, 
        subscription_type_id, 
        start_date, 
        end_date, 
        status
    )
    SELECT 
        original_sub.user_id,
        original_sub.subscription_type_id,
        new_start_date,
        new_start_date + INTERVAL '1 day' * st.duration_days - INTERVAL '1 day',
        'active'
    FROM public.subscription_types st
    WHERE st.id = original_sub.subscription_type_id
    RETURNING id INTO new_subscription_id;
    
    -- Ενημέρωση κατάστασης χρήστη
    UPDATE public.app_users 
    SET subscription_status = 'active'
    WHERE id = original_sub.user_id;
    
    RETURN new_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;