
-- Ασφαλής προσθήκη foreign keys με έλεγχο ύπαρξης

-- Διόρθωση foreign keys για exercise_results
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_exercise_results_workout_completion') THEN
        ALTER TABLE public.exercise_results 
        ADD CONSTRAINT fk_exercise_results_workout_completion 
        FOREIGN KEY (workout_completion_id) REFERENCES public.workout_completions(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_exercise_results_program_exercise') THEN
        ALTER TABLE public.exercise_results 
        ADD CONSTRAINT fk_exercise_results_program_exercise 
        FOREIGN KEY (program_exercise_id) REFERENCES public.program_exercises(id);
    END IF;
END $$;

-- Διόρθωση foreign keys για strength_test_data
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_strength_test_data_exercise') THEN
        ALTER TABLE public.strength_test_data 
        ADD CONSTRAINT fk_strength_test_data_exercise 
        FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);
    END IF;
END $$;

-- Διόρθωση άλλων σχέσεων
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_program_weeks_program_id') THEN
        ALTER TABLE public.program_weeks 
        ADD CONSTRAINT fk_program_weeks_program_id 
        FOREIGN KEY (program_id) REFERENCES public.programs(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_program_days_week_id') THEN
        ALTER TABLE public.program_days 
        ADD CONSTRAINT fk_program_days_week_id 
        FOREIGN KEY (week_id) REFERENCES public.program_weeks(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_program_blocks_day_id') THEN
        ALTER TABLE public.program_blocks 
        ADD CONSTRAINT fk_program_blocks_day_id 
        FOREIGN KEY (day_id) REFERENCES public.program_days(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_program_exercises_block_id') THEN
        ALTER TABLE public.program_exercises 
        ADD CONSTRAINT fk_program_exercises_block_id 
        FOREIGN KEY (block_id) REFERENCES public.program_blocks(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_program_exercises_exercise_id') THEN
        ALTER TABLE public.program_exercises 
        ADD CONSTRAINT fk_program_exercises_exercise_id 
        FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);
    END IF;
END $$;

-- Test sessions relationships
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_anthropometric_test_data_session') THEN
        ALTER TABLE public.anthropometric_test_data 
        ADD CONSTRAINT fk_anthropometric_test_data_session 
        FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_functional_test_data_session') THEN
        ALTER TABLE public.functional_test_data 
        ADD CONSTRAINT fk_functional_test_data_session 
        FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_endurance_test_data_session') THEN
        ALTER TABLE public.endurance_test_data 
        ADD CONSTRAINT fk_endurance_test_data_session 
        FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_jump_test_data_session') THEN
        ALTER TABLE public.jump_test_data 
        ADD CONSTRAINT fk_jump_test_data_session 
        FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_strength_test_data_session') THEN
        ALTER TABLE public.strength_test_data 
        ADD CONSTRAINT fk_strength_test_data_session 
        FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);
    END IF;
END $$;

-- Indexes για καλύτερη απόδοση
CREATE INDEX IF NOT EXISTS idx_exercise_results_workout_completion ON public.exercise_results(workout_completion_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_program_exercise ON public.exercise_results(program_exercise_id);
CREATE INDEX IF NOT EXISTS idx_strength_test_data_exercise ON public.strength_test_data(exercise_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_program ON public.program_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_user ON public.program_assignments(user_id);
