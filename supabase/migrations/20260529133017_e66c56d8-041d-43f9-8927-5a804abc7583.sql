
DO $$
DECLARE
  src_day uuid := 'c5729e80-90b4-4a2e-8973-67ad9794485c';
  target_days uuid[] := ARRAY['9b54b2a7-64ad-4159-a726-f285c4609c41'::uuid, '691170d6-cb36-4572-9b65-bec0747f0a05'::uuid];
  tgt uuid;
  src_block RECORD;
  new_block_id uuid;
BEGIN
  FOREACH tgt IN ARRAY target_days LOOP
    -- Delete existing exercises and blocks for the target day
    DELETE FROM program_exercises WHERE block_id IN (SELECT id FROM program_blocks WHERE day_id = tgt);
    DELETE FROM program_blocks WHERE day_id = tgt;

    -- Copy blocks from source
    FOR src_block IN SELECT * FROM program_blocks WHERE day_id = src_day ORDER BY block_order LOOP
      INSERT INTO program_blocks (day_id, name, block_order, training_type, workout_format, workout_duration, block_sets)
      VALUES (tgt, src_block.name, src_block.block_order, src_block.training_type, src_block.workout_format, src_block.workout_duration, src_block.block_sets)
      RETURNING id INTO new_block_id;

      -- Copy exercises
      INSERT INTO program_exercises (block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest, exercise_order, percentage_1rm, velocity_ms, notes, kg_mode, reps_mode)
      SELECT new_block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest, exercise_order, percentage_1rm, velocity_ms, notes, kg_mode, reps_mode
      FROM program_exercises WHERE block_id = src_block.id;
    END LOOP;
  END LOOP;
END $$;
