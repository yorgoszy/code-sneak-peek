
DO $$
DECLARE
  src_day uuid := '1ce3617a-3c9c-4a81-93fa-4373aa6cce3c';
  target_days uuid[] := ARRAY[
    'c0f9323f-7975-4cea-977f-267da295c52b'::uuid, -- Poutlis week2 day2
    'e52cd294-fe6e-4126-995d-2f3488bdbe76'::uuid  -- Pasalis week2 day2
  ];
  t_day uuid;
  src_block RECORD;
  new_block_id uuid;
BEGIN
  FOREACH t_day IN ARRAY target_days LOOP
    -- Delete existing exercises then blocks for the target day
    DELETE FROM public.program_exercises
      WHERE block_id IN (SELECT id FROM public.program_blocks WHERE day_id = t_day);
    DELETE FROM public.program_blocks WHERE day_id = t_day;

    -- Clone blocks from source
    FOR src_block IN
      SELECT * FROM public.program_blocks WHERE day_id = src_day ORDER BY block_order
    LOOP
      new_block_id := gen_random_uuid();
      INSERT INTO public.program_blocks
        (id, day_id, name, block_order, training_type, workout_format, workout_duration, block_sets)
      VALUES
        (new_block_id, t_day, src_block.name, src_block.block_order, src_block.training_type,
         src_block.workout_format, src_block.workout_duration, src_block.block_sets);

      -- Clone exercises for this block
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
  END LOOP;
END $$;
