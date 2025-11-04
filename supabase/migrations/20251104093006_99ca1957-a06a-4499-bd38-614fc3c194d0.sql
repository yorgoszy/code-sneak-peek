-- Create trigger to handle 1RM updates when Force/Velocity records are deleted
CREATE OR REPLACE FUNCTION recalculate_1rm_after_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_test_date date;
  v_max_weight numeric;
  v_max_date date;
BEGIN
  -- Get user_id from the deleted attempt
  SELECT user_id, test_date 
  INTO v_user_id, v_test_date
  FROM strength_test_sessions 
  WHERE id = OLD.test_session_id;

  -- Find the new maximum weight for this user+exercise combination
  SELECT MAX(sta.weight_kg), MAX(sts.test_date)
  INTO v_max_weight, v_max_date
  FROM strength_test_attempts sta
  JOIN strength_test_sessions sts ON sts.id = sta.test_session_id
  WHERE sts.user_id = v_user_id 
    AND sta.exercise_id = OLD.exercise_id;

  -- If no more attempts exist for this user+exercise, delete the 1RM record
  IF v_max_weight IS NULL THEN
    DELETE FROM user_exercise_1rm
    WHERE user_id = v_user_id 
      AND exercise_id = OLD.exercise_id;
  ELSE
    -- Update the 1RM record with the new maximum
    UPDATE user_exercise_1rm
    SET 
      weight = v_max_weight,
      recorded_date = v_max_date,
      notes = 'Αυτόματη ενημέρωση μετά από διαγραφή',
      updated_at = NOW()
    WHERE user_id = v_user_id 
      AND exercise_id = OLD.exercise_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for DELETE operations on strength_test_attempts
DROP TRIGGER IF EXISTS trigger_recalculate_1rm_after_delete ON strength_test_attempts;
CREATE TRIGGER trigger_recalculate_1rm_after_delete
  AFTER DELETE ON strength_test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_1rm_after_delete();

-- Also create trigger for UPDATE operations (in case weight changes)
CREATE OR REPLACE FUNCTION recalculate_1rm_after_update()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_test_date date;
  v_max_weight numeric;
  v_max_date date;
  v_existing_record record;
BEGIN
  -- Get user_id from the updated attempt
  SELECT user_id, test_date 
  INTO v_user_id, v_test_date
  FROM strength_test_sessions 
  WHERE id = NEW.test_session_id;

  -- Find the maximum weight for this user+exercise combination
  SELECT sta.weight_kg, sts.test_date
  INTO v_max_weight, v_max_date
  FROM strength_test_attempts sta
  JOIN strength_test_sessions sts ON sts.id = sta.test_session_id
  WHERE sts.user_id = v_user_id 
    AND sta.exercise_id = NEW.exercise_id
  ORDER BY sta.weight_kg DESC, sts.test_date DESC
  LIMIT 1;

  -- Check existing 1RM record
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
      v_max_weight,
      v_max_date,
      'Αυτόματη καταγραφή από Force/Velocity test'
    );
  -- If weight changed, update the record
  ELSIF v_max_weight != v_existing_record.weight THEN
    UPDATE user_exercise_1rm
    SET 
      weight = v_max_weight,
      recorded_date = v_max_date,
      notes = 'Αυτόματη ενημέρωση από Force/Velocity test',
      updated_at = NOW()
    WHERE id = v_existing_record.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for UPDATE operations on strength_test_attempts
DROP TRIGGER IF EXISTS trigger_recalculate_1rm_after_update ON strength_test_attempts;
CREATE TRIGGER trigger_recalculate_1rm_after_update
  AFTER UPDATE ON strength_test_attempts
  FOR EACH ROW
  WHEN (OLD.weight_kg IS DISTINCT FROM NEW.weight_kg)
  EXECUTE FUNCTION recalculate_1rm_after_update();