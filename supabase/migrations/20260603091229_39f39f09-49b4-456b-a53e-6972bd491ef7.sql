DO $$
DECLARE
  src_day uuid := 'c0f9323f-7975-4cea-977f-267da295c52b'; -- Νίκος W2D2 (26/5/2026)
  target_days uuid[] := ARRAY[
    -- Νίκος (program 1ccf9753) - όλες οι Τρίτες πλην του source
    '9d03e9be-3fa2-4d5c-8993-9502f9ee73e6',
    '1c9ff72e-748b-4976-ad4c-91ad5c59204b',
    '199cb775-4601-4202-a804-f280df52bccc',
    '18a003ab-e421-4cba-aac1-252760a3f1f5',
    '725bbffc-005f-44f1-9b94-38c5c9edfe0c',
    'bf5a7eb3-9c58-4e3e-88e6-6d700e7a30c3',
    -- Κώστας (program ae47a7e6) - όλες οι Τρίτες
    '933dba1a-e867-4acf-ae1d-878072153511',
    'e52cd294-fe6e-4126-995d-2f3488bdbe76',
    '925bc3d2-0f34-4d42-b4c2-1c8adb8e5ee2',
    '945762f4-016e-41ad-9de6-796c33ec41b4',
    '48346d1c-bac6-4946-83d6-ad602f62fff4',
    'ba57fdc3-67ca-4caf-b876-fd9618f5bc4c',
    '763edffc-192e-4309-bf2e-9e3b402053d0'
  ];
  tgt uuid;
  src_block RECORD;
  new_block_id uuid;
BEGIN
  -- 1) Καθαρισμός existing blocks/exercises σε όλα τα targets
  DELETE FROM program_exercises
  WHERE block_id IN (SELECT id FROM program_blocks WHERE day_id = ANY(target_days));
  DELETE FROM program_blocks WHERE day_id = ANY(target_days);

  -- 2) Για κάθε target day, αντιγραφή blocks + exercises από source
  FOREACH tgt IN ARRAY target_days LOOP
    FOR src_block IN
      SELECT * FROM program_blocks WHERE day_id = src_day ORDER BY block_order
    LOOP
      INSERT INTO program_blocks (
        day_id, name, block_order, training_type, workout_format,
        workout_duration, block_sets
      )
      VALUES (
        tgt, src_block.name, src_block.block_order, src_block.training_type,
        src_block.workout_format, src_block.workout_duration, src_block.block_sets
      )
      RETURNING id INTO new_block_id;

      INSERT INTO program_exercises (
        block_id, exercise_id, exercise_order, sets, reps, reps_mode,
        kg, kg_mode, percentage_1rm, velocity_ms, tempo, rest, notes
      )
      SELECT
        new_block_id, exercise_id, exercise_order, sets, reps, reps_mode,
        kg, kg_mode, percentage_1rm, velocity_ms, tempo, rest, notes
      FROM program_exercises
      WHERE block_id = src_block.id
      ORDER BY exercise_order;
    END LOOP;
  END LOOP;
END $$;