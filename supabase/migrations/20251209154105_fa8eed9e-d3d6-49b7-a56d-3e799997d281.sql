-- Εισαγωγή υπολογισμένων stats με απλοποιημένη λογική
INSERT INTO training_type_stats (user_id, assignment_id, workout_completion_id, training_date, training_type, minutes)
SELECT 
  wc.user_id,
  wc.assignment_id,
  wc.id as workout_completion_id,
  wc.scheduled_date as training_date,
  pb.training_type,
  -- Απλός υπολογισμός: 5 λεπτά ανά block ως default
  5 as minutes
FROM workout_completions wc
JOIN program_assignments pa ON wc.assignment_id = pa.id
JOIN programs p ON pa.program_id = p.id
JOIN program_weeks pw ON pw.program_id = p.id
JOIN program_days pd ON pd.week_id = pw.id
JOIN program_blocks pb ON pb.day_id = pd.id
WHERE wc.status = 'completed'
AND pb.training_type IS NOT NULL
AND pb.training_type NOT IN ('mobility', 'stability', 'activation', 'neural act', 'recovery', 'warm up', 'end')
AND NOT EXISTS (
  SELECT 1 FROM training_type_stats tts 
  WHERE tts.workout_completion_id = wc.id 
  AND tts.training_type = pb.training_type
)
GROUP BY wc.user_id, wc.assignment_id, wc.id, wc.scheduled_date, pb.training_type
ON CONFLICT DO NOTHING;