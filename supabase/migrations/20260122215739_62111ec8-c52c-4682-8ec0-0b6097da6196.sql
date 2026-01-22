-- Create or update trigger function to sync HYPERsync subscriptions to coach_profiles
CREATE OR REPLACE FUNCTION public.sync_hypersync_subscription_to_coach_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription_type subscription_types%ROWTYPE;
  v_user_role text;
BEGIN
  -- Only process for INSERT or UPDATE with status = 'active'
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Get subscription type details
  SELECT * INTO v_subscription_type 
  FROM subscription_types 
  WHERE id = NEW.subscription_type_id;
  
  -- Only process coach_shop_only subscriptions (like HYPERsync)
  IF v_subscription_type.coach_shop_only IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Get user role
  SELECT role INTO v_user_role 
  FROM app_users 
  WHERE id = NEW.user_id;
  
  -- Only process for coaches
  IF v_user_role != 'coach' THEN
    RETURN NEW;
  END IF;

  -- Upsert coach_profiles to activate the coach
  INSERT INTO coach_profiles (coach_id, is_active, subscription_end_date, updated_at)
  VALUES (NEW.user_id, true, NEW.end_date, now())
  ON CONFLICT (coach_id) 
  DO UPDATE SET 
    is_active = true,
    subscription_end_date = EXCLUDED.subscription_end_date,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_hypersync_on_subscription ON user_subscriptions;

-- Create trigger for INSERT and UPDATE on user_subscriptions
CREATE TRIGGER sync_hypersync_on_subscription
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_hypersync_subscription_to_coach_profile();

-- Also create the coach_profile for the coach who already has the subscription
INSERT INTO coach_profiles (coach_id, is_active, subscription_end_date, updated_at)
SELECT 
  us.user_id,
  true,
  us.end_date,
  now()
FROM user_subscriptions us
JOIN subscription_types st ON st.id = us.subscription_type_id
JOIN app_users au ON au.id = us.user_id
WHERE st.coach_shop_only = true 
  AND us.status = 'active'
  AND au.role = 'coach'
  AND us.user_id NOT IN (SELECT coach_id FROM coach_profiles WHERE coach_id IS NOT NULL)
ON CONFLICT (coach_id) 
DO UPDATE SET 
  is_active = true,
  subscription_end_date = EXCLUDED.subscription_end_date,
  updated_at = now();