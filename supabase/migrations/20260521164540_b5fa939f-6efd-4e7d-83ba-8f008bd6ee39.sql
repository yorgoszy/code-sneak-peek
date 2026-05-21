
WITH user_bp AS (
  SELECT DISTINCT ON (pa.user_id) pa.user_id, pa.program_id, u.weight as bp_1rm
  FROM program_assignments pa
  JOIN user_exercise_1rm u ON u.user_id=pa.user_id AND u.exercise_id='d85f01d1-73a7-4b5b-9d72-4ac3b8d4802b'
  WHERE pa.status='active'
  ORDER BY pa.user_id, u.recorded_date DESC
),
target_rows AS (
  SELECT pe.id as pe_id, ub.bp_1rm, pe.percentage_1rm,
    (ub.bp_1rm * pe.percentage_1rm / 100.0) as raw_kg
  FROM program_exercises pe
  JOIN program_blocks pb ON pb.id=pe.block_id
  JOIN program_days pd ON pd.id=pb.day_id
  JOIN program_weeks pw ON pw.id=pd.week_id
  JOIN user_bp ub ON ub.program_id=pw.program_id
  WHERE pe.exercise_id='d85f01d1-73a7-4b5b-9d72-4ac3b8d4802b'
    AND lower(pb.name)='str'
    AND pw.week_number IN (1,2,3,4)
    AND pe.percentage_1rm IS NOT NULL AND pe.percentage_1rm > 0
)
UPDATE program_exercises pe
SET kg = (
  CASE
    WHEN (round(tr.raw_kg)::int) % 2 = 0 THEN round(tr.raw_kg)::int
    WHEN abs(tr.raw_kg - (round(tr.raw_kg)::int - 1)) < abs(tr.raw_kg - (round(tr.raw_kg)::int + 1))
      THEN (round(tr.raw_kg)::int - 1)
    ELSE (round(tr.raw_kg)::int + 1)
  END
)::text
FROM target_rows tr
WHERE pe.id = tr.pe_id;
