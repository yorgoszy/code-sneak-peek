-- Update the renew_subscription function to work with months
CREATE OR REPLACE FUNCTION public.renew_subscription(original_subscription_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    original_sub RECORD;
    new_start_date DATE;
    new_end_date DATE;
    new_subscription_id UUID;
BEGIN
    -- Λήψη στοιχείων αρχικής συνδρομής
    SELECT user_id, subscription_type_id, end_date, status
    INTO original_sub
    FROM public.user_subscriptions 
    WHERE id = original_subscription_id;
    
    -- Καθορισμός ημερομηνίας έναρξης νέας συνδρομής (πάντα επόμενη ημέρα από τη λήξη)
    new_start_date := original_sub.end_date + INTERVAL '1 day';
    
    -- Υπολογισμός ημερομηνίας λήξης με βάση τους μήνες
    SELECT new_start_date + INTERVAL '1 month' * st.duration_months - INTERVAL '1 day'
    INTO new_end_date
    FROM public.subscription_types st
    WHERE st.id = original_sub.subscription_type_id;
    
    -- Δημιουργία νέας συνδρομής
    INSERT INTO public.user_subscriptions (
        user_id, 
        subscription_type_id, 
        start_date, 
        end_date, 
        status
    )
    VALUES (
        original_sub.user_id,
        original_sub.subscription_type_id,
        new_start_date,
        new_end_date,
        'active'
    )
    RETURNING id INTO new_subscription_id;
    
    -- Ενημέρωση κατάστασης χρήστη
    UPDATE public.app_users 
    SET subscription_status = 'active'
    WHERE id = original_sub.user_id;
    
    RETURN new_subscription_id;
END;
$function$;