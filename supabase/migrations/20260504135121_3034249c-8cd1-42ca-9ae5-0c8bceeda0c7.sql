ALTER TABLE public.muaythai_fights
DROP CONSTRAINT IF EXISTS muaythai_fights_result_check;

ALTER TABLE public.muaythai_fights
ADD CONSTRAINT muaythai_fights_result_check
CHECK (result IN ('win', 'loss', 'draw', 'no_contest', 'win_ko', 'loss_ko', 'win_tko', 'loss_tko', 'disqualified'));

COMMENT ON CONSTRAINT muaythai_fights_result_check ON public.muaythai_fights
IS 'Allowed fight results including KO, TKO and disqualification.';