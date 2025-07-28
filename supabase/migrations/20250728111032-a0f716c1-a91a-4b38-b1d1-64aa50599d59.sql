-- Add program mode to subscription_mode enum if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        INNER JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'subscription_mode_enum' AND e.enumlabel = 'program'
    ) THEN
        ALTER TYPE subscription_mode_enum ADD VALUE 'program';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If enum doesn't exist, we need to handle this differently
        RAISE NOTICE 'Enum type subscription_mode_enum might not exist or other error: %', SQLERRM;
END $$;

-- Add program_id column to subscription_types table if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_types' AND column_name = 'program_id'
    ) THEN
        ALTER TABLE public.subscription_types 
        ADD COLUMN program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL;
    END IF;
END $$;