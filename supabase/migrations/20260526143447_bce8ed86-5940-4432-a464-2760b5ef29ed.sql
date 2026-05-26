
DO $$
DECLARE
  src_day uuid := '1ce3617a-3c9c-4a81-93fa-4373aa6cce3c';
  t_day uuid := '9bd4c487-8651-478a-9701-e94ca4b937b9';
  src_block RECORD;
  new_block_id uuid;
BEGIN
  DELETE FROM public.program_exercises
    WHERE block_id IN (SELECT id FROM public.program_blocks WHERE day_id = t_day);
  DELETE FROM public.program_blocks WHERE day_id = t_day;

  FOR src_block IN
    SELECT * FROM public.program_blocks WHERE day_id = src_day ORDER BY block_order
  LOOP
    new_block_id := gen_random_uuid();
    INSERT INTO public.program_blocks
      (id, day_id, name, block_order, training_type, workout_format, workout_duration, block_sets)
    VALUES
      (new_block_id, t_day, src_block.name, src_block.block_order, src_block.training_type,
       src_block.workout_format, src_block.workout_duration, src_block.block_sets);

    INSERT INTO public.program_exercises
      (id, block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest, exercise_order,
       percentage_1rm, velocity_ms, notes, kg_mode, reps_mode)
    SELECT
      gen_random_uuid(), new_block_id, exercise_id, sets, reps, rm, kg, ms, tempo, rest,
      exercise_order, percentage_1rm, velocity_ms, notes, kg_mode, reps_mode
    FROM public.program_exercises
    WHERE block_id = src_block.id
    ORDER BY exercise_order;
  END LOOP;
END $$;
