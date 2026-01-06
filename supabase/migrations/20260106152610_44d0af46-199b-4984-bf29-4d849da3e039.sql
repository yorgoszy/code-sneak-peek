-- Backfill coach_id for existing groups
UPDATE public.groups
SET coach_id = created_by
WHERE coach_id IS NULL;
