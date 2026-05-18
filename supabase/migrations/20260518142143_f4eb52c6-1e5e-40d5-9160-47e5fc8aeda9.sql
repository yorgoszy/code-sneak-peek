
DO $$
DECLARE
  src_program_id uuid := 'a5e37d5f-62a3-4610-b7da-ca6c80979eda';
  admin_app_user_id uuid := 'c6d44641-3b95-46bd-8270-e5ed72de25ad';
  new_program_id uuid := gen_random_uuid();
  src_week record;
  src_day record;
  src_block record;
  new_week_id uuid;
  new_day_id uuid;
  new_block_id uuid;
  td date[] := ARRAY[
    '2026-05-18','2026-05-19','2026-05-20','2026-05-21','2026-05-22',
    '2026-05-25','2026-05-26','2026-05-27','2026-05-28','2026-05-29',
    '2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05',
    '2026-06-08','2026-06-09','2026-06-10','2026-06-11','2026-06-12',
    '2026-06-15','2026-06-16','2026-06-17','2026-06-18','2026-06-19',
    '2026-06-22','2026-06-23','2026-06-24','2026-06-25','2026-06-26',
    '2026-06-29','2026-06-30','2026-07-01'
  ]::date[];
BEGIN
  INSERT INTO programs (id, name, description, type, duration, status, created_by, is_template, user_id, start_date, training_days, coach_id, price, is_sellable)
  SELECT new_program_id, name, description, type, duration, status, created_by, false, NULL, start_date, training_days, coach_id, price, is_sellable
  FROM programs WHERE id = src_program_id;

  FOR src_week IN SELECT * FROM program_weeks WHERE program_id = src_program_id ORDER BY week_number LOOP
    new_week_id := gen_random_uuid();
    INSERT INTO program_weeks (id, program_id, name, week_number) VALUES (new_week_id, new_program_id, src_week.name, src_week.week_number);

    FOR src_day IN SELECT * FROM program_days WHERE week_id = src_week.id ORDER BY day_number LOOP
      new_day_id := gen_random_uuid();
      INSERT INTO program_days (id, week_id, name, day_number, estimated_duration_minutes, is_test_day, test_types, is_competition_day, upper_effort, lower_effort, is_esd_day, is_recovery_day)
      VALUES (new_day_id, new_week_id, src_day.name, src_day.day_number, src_day.estimated_duration_minutes, src_day.is_test_day, src_day.test_types, src_day.is_competition_day, src_day.upper_effort, src_day.lower_effort, src_day.is_esd_day, src_day.is_recovery_day);

      FOR src_block IN SELECT * FROM program_blocks WHERE day_id = src_day.id ORDER BY block_order LOOP
        new_block_id := gen_random_uuid();
        INSERT INTO program_blocks (id, day_id, name, block_order, training_type, workout_format, workout_duration, block_sets)
        VALUES (new_block_id, new_day_id, src_block.name, src_block.block_order, src_block.training_type, src_block.workout_format, src_block.workout_duration, src_block.block_sets);

        INSERT INTO program_exercises (id, block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest, exercise_order, percentage_1rm, velocity_ms, notes, kg_mode, reps_mode)
        SELECT gen_random_uuid(), new_block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest, exercise_order, percentage_1rm, velocity_ms, notes, kg_mode, reps_mode
        FROM program_exercises WHERE block_id = src_block.id;
      END LOOP;
    END LOOP;
  END LOOP;

  INSERT INTO program_assignments (id, program_id, user_id, status, start_date, end_date, training_dates, assignment_type, assigned_by)
  VALUES (gen_random_uuid(), new_program_id, admin_app_user_id, 'active', td[1], td[array_length(td,1)], td, 'individual', admin_app_user_id);
END $$;
