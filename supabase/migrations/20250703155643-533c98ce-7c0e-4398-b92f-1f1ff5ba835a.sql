-- Μαρκάρισμα χαμένων προπονήσεων για προπονήσεις που δεν έχουν completion και είναι στο παρελθόν
INSERT INTO workout_completions (assignment_id, user_id, scheduled_date, status, status_color, created_at, updated_at)
SELECT 
    pa.id as assignment_id,
    pa.user_id as user_id,
    td.date_value as scheduled_date,
    'missed' as status,
    'red' as status_color,
    NOW() as created_at,
    NOW() as updated_at
FROM program_assignments pa,
LATERAL unnest(pa.training_dates) AS td(date_value)
WHERE td.date_value < CURRENT_DATE
AND pa.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM workout_completions wc 
    WHERE wc.assignment_id = pa.id 
    AND wc.scheduled_date = td.date_value
);