
-- Function to automatically create/update 1RM records from strength test attempts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_update_1rm ON strength_test_attempts;

CREATE TRIGGER trigger_auto_update_1rm
  AFTER INSERT ON strength_test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_1rm_from_strength_test();

-- Backfill existing strength_test_attempts to create missing 1RM records
INSERT INTO user_exercise_1rm (user_id, exercise_id, weight, recorded_date, notes)
SELECT DISTINCT ON (sts.user_id, sta.exercise_id)
  sts.user_id,
  sta.exercise_id,
  sta.weight_kg,
  sts.test_date,
  'Αυτόματη καταγραφή από Force/Velocity test (backfill)'
FROM strength_test_attempts sta
JOIN strength_test_sessions sts ON sts.id = sta.test_session_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_exercise_1rm u1rm
  WHERE u1rm.user_id = sts.user_id 
    AND u1rm.exercise_id = sta.exercise_id
)
ORDER BY sts.user_id, sta.exercise_id, sts.test_date DESC, sta.weight_kg DESC;

-- Update existing 1RM records if there's a higher weight in strength tests
UPDATE user_exercise_1rm u1rm
SET 
  weight = subq.max_weight,
  recorded_date = subq.latest_date,
  notes = 'Αυτόματη ενημέρωση από Force/Velocity test (backfill)',
  updated_at = NOW()
FROM (
  SELECT 
    sts.user_id,
    sta.exercise_id,
    MAX(sta.weight_kg) as max_weight,
    MAX(sts.test_date) as latest_date
  FROM strength_test_attempts sta
  JOIN strength_test_sessions sts ON sts.id = sta.test_session_id
  GROUP BY sts.user_id, sta.exercise_id
) subq
WHERE u1rm.user_id = subq.user_id 
  AND u1rm.exercise_id = subq.exercise_id
  AND subq.max_weight > u1rm.weight;
