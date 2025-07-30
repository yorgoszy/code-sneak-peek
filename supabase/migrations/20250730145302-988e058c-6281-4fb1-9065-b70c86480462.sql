-- Δημιουργία visit_packages για συνδρομές που δεν έχουν
DO $$
DECLARE
  subscription_record RECORD;
  expiry_date DATE;
BEGIN
  -- Βρες όλες τις visit_based συνδρομές που δεν έχουν αντίστοιχο visit_package
  FOR subscription_record IN 
    SELECT 
      us.id as subscription_id,
      us.user_id,
      us.start_date,
      us.end_date,
      us.payment_id,
      st.visit_count,
      st.visit_expiry_months,
      st.name as subscription_name,
      COALESCE(p.amount, 0) as amount
    FROM user_subscriptions us
    JOIN subscription_types st ON us.subscription_type_id = st.id
    LEFT JOIN payments p ON us.payment_id = p.id
    WHERE st.subscription_mode = 'visit_based' 
      AND st.visit_count > 0
      AND NOT EXISTS (
        SELECT 1 FROM visit_packages vp 
        WHERE vp.user_id = us.user_id 
          AND vp.payment_id = us.payment_id
          AND vp.total_visits = st.visit_count
      )
  LOOP
    -- Υπολογισμός ημερομηνίας λήξης
    expiry_date := subscription_record.start_date + INTERVAL '1 month' * COALESCE(subscription_record.visit_expiry_months, 12);
    
    -- Δημιουργία visit_package
    INSERT INTO visit_packages (
      user_id,
      total_visits,
      remaining_visits,
      purchase_date,
      expiry_date,
      price,
      payment_id,
      status
    ) VALUES (
      subscription_record.user_id,
      subscription_record.visit_count,
      subscription_record.visit_count, -- Αρχικά όλες οι επισκέψεις διαθέσιμες
      subscription_record.start_date,
      expiry_date,
      subscription_record.amount,
      subscription_record.payment_id,
      'active'
    );
    
    RAISE NOTICE 'Created visit package for user % with % visits (subscription: %)', 
      subscription_record.user_id, 
      subscription_record.visit_count,
      subscription_record.subscription_name;
  END LOOP;
END $$;