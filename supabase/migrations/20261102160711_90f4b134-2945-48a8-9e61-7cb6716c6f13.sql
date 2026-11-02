DO $$ BEGIN
BEGIN
UPDATE public.coach_subscriptions SET coach_id='0d6381b6-03bc-4b2b-a64b-918d2de96a0e' WHERE id='a69d1162-678f-4bd6-9389-9d81b09fd849';
RAISE EXCEPTION 'Test failed: mismatched coach accepted';
EXCEPTION WHEN raise_exception THEN
IF SQLERRM <> 'User must belong to the subscription coach' THEN RAISE; END IF;
END;
END $$;