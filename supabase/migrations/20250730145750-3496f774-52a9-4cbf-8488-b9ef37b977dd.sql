-- Δημιουργία videocall_packages για συνδρομές που δεν έχουν
DO $$
DECLARE
  subscription_record RECORD;
  expiry_date DATE;
  videocall_count INTEGER;
BEGIN
  -- Βρες όλες τις videocall συνδρομές που δεν έχουν αντίστοιχο videocall_package
  FOR subscription_record IN 
    SELECT 
      us.id as subscription_id,
      us.user_id,
      us.start_date,
      us.end_date,
      us.payment_id,
      st.name as subscription_name,
      st.single_purchase,
      COALESCE(p.amount, 0) as amount
    FROM user_subscriptions us
    JOIN subscription_types st ON us.subscription_type_id = st.id
    LEFT JOIN payments p ON us.payment_id = p.id
    WHERE st.subscription_mode = 'videocall'
      AND NOT EXISTS (
        SELECT 1 FROM videocall_packages vcp 
        WHERE vcp.user_id = us.user_id 
          AND vcp.payment_id = us.payment_id
      )
  LOOP
    -- Για single_purchase videocall sessions δίνουμε 1 videocall
    -- Για άλλες μπορούμε να προσθέσουμε logic μετά
    IF subscription_record.single_purchase THEN
      videocall_count := 1;
      expiry_date := subscription_record.start_date + INTERVAL '3 months'; -- Default 3 μήνες
    ELSE
      videocall_count := 4; -- Default για μηνιαίες videocall συνδρομές
      expiry_date := subscription_record.end_date;
    END IF;
    
    -- Δημιουργία videocall_package
    INSERT INTO videocall_packages (
      user_id,
      total_videocalls,
      remaining_videocalls,
      purchase_date,
      expiry_date,
      price,
      payment_id,
      status
    ) VALUES (
      subscription_record.user_id,
      videocall_count,
      videocall_count, -- Αρχικά όλες οι βιντεοκλήσεις διαθέσιμες
      subscription_record.start_date,
      expiry_date,
      subscription_record.amount,
      subscription_record.payment_id,
      'active'
    );
    
    RAISE NOTICE 'Created videocall package for user % with % videocalls (subscription: %)', 
      subscription_record.user_id, 
      videocall_count,
      subscription_record.subscription_name;
  END LOOP;
END $$;