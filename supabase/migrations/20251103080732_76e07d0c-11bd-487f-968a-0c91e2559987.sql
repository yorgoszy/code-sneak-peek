
-- Fix function search path security warning
CREATE OR REPLACE FUNCTION auto_update_1rm_from_strength_test()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_test_date date;
  v_existing_record record;
BEGIN
  -- Get user_id and test_date from strength_test_sessions
  SELECT user_id, test_date 
  INTO v_user_id, v_test_date
  FROM strength_test_sessions 
  WHERE id = NEW.test_session_id;

  -- Check if there's an existing 1RM record for this user+exercise
  SELECT * INTO v_existing_record
  FROM user_exercise_1rm
  WHERE user_id = v_user_id 
    AND exercise_id = NEW.exercise_id
  ORDER BY recorded_date DESC
  LIMIT 1;

  -- If no existing record, create new one
  IF v_existing_record IS NULL THEN
    INSERT INTO user_exercise_1rm (
      user_id,
      exercise_id,
      weight,
      recorded_date,
      notes
    ) VALUES (
      v_user_id,
      NEW.exercise_id,
      NEW.weight_kg,
      v_test_date,
      'Αυτόματη καταγραφή από Force/Velocity test'
    );
  -- If new weight is greater than existing, update
  ELSIF NEW.weight_kg > v_existing_record.weight THEN
    UPDATE user_exercise_1rm
    SET 
      weight = NEW.weight_kg,
      recorded_date = v_test_date,
      notes = 'Αυτόματη ενημέρωση από Force/Velocity test',
      updated_at = NOW()
    WHERE id = v_existing_record.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
