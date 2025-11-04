-- Robust recalculation using statement-level trigger with transition tables
CREATE OR REPLACE FUNCTION public.recalc_1rm_after_attempts_delete_stmt()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  v_max_weight numeric;
  v_max_date date;
BEGIN
  -- For each affected (user_id, exercise_id) recompute latest 1RM
  FOR rec IN (
    SELECT DISTINCT sts.user_id, d.exercise_id
    FROM deleted_rows d
    JOIN public.strength_test_sessions sts ON sts.id = d.test_session_id
  ) LOOP
    -- Compute new max for that user + exercise
    SELECT sta.weight_kg, sts.test_date
    INTO v_max_weight, v_max_date
    FROM public.strength_test_attempts sta
    JOIN public.strength_test_sessions sts ON sts.id = sta.test_session_id
    WHERE sts.user_id = rec.user_id
      AND sta.exercise_id = rec.exercise_id
    ORDER BY sta.weight_kg DESC, sts.test_date DESC
    LIMIT 1;

    IF v_max_weight IS NULL THEN
      -- No attempts remain: delete 1RM rows for that user/exercise
      DELETE FROM public.user_exercise_1rm
      WHERE user_id = rec.user_id
        AND exercise_id = rec.exercise_id;
    ELSE
      -- Upsert/update 1RM
      INSERT INTO public.user_exercise_1rm (user_id, exercise_id, weight, recorded_date, notes)
      VALUES (rec.user_id, rec.exercise_id, v_max_weight, v_max_date, 'Αυτόματη ενημέρωση μετά από διαγραφή')
      ON CONFLICT (user_id, exercise_id)
      DO UPDATE SET weight = EXCLUDED.weight,
                    recorded_date = EXCLUDED.recorded_date,
                    notes = EXCLUDED.notes,
                    updated_at = NOW();
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop row-level delete trigger to avoid duplicate work (optional, keep if desired)
DROP TRIGGER IF EXISTS trigger_recalculate_1rm_after_delete ON public.strength_test_attempts;

-- Create statement-level trigger using transition tables
DROP TRIGGER IF EXISTS trigger_recalc_1rm_after_attempts_delete_stmt ON public.strength_test_attempts;
CREATE TRIGGER trigger_recalc_1rm_after_attempts_delete_stmt
  AFTER DELETE ON public.strength_test_attempts
  REFERENCING OLD TABLE AS deleted_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.recalc_1rm_after_attempts_delete_stmt();

-- Ensure update trigger exists and is schema-qualified
CREATE OR REPLACE FUNCTION public.recalculate_1rm_after_update()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_max_weight numeric;
  v_max_date date;
  v_existing_record record;
BEGIN
  SELECT user_id 
  INTO v_user_id
  FROM public.strength_test_sessions 
  WHERE id = NEW.test_session_id;

  SELECT sta.weight_kg, sts.test_date
  INTO v_max_weight, v_max_date
  FROM public.strength_test_attempts sta
  JOIN public.strength_test_sessions sts ON sts.id = sta.test_session_id
  WHERE sts.user_id = v_user_id 
    AND sta.exercise_id = NEW.exercise_id
  ORDER BY sta.weight_kg DESC, sts.test_date DESC
  LIMIT 1;

  SELECT * INTO v_existing_record
  FROM public.user_exercise_1rm
  WHERE user_id = v_user_id 
    AND exercise_id = NEW.exercise_id
  ORDER BY recorded_date DESC
  LIMIT 1;

  IF v_existing_record IS NULL THEN
    INSERT INTO public.user_exercise_1rm (
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
  ELSIF v_max_weight IS DISTINCT FROM v_existing_record.weight OR v_max_date IS DISTINCT FROM v_existing_record.recorded_date THEN
    UPDATE public.user_exercise_1rm
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

DROP TRIGGER IF EXISTS trigger_recalculate_1rm_after_update ON public.strength_test_attempts;
CREATE TRIGGER trigger_recalculate_1rm_after_update
  AFTER UPDATE OF weight_kg ON public.strength_test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_1rm_after_update();