
WITH active_programs AS (
  SELECT DISTINCT pa.program_id, pa.user_id
  FROM program_assignments pa
  WHERE pa.status = 'active'
),
target_pe AS (
  SELECT pe.id AS pe_id, ap.user_id, pe.percentage_1rm
  FROM program_exercises pe
  JOIN program_blocks pb ON pb.id = pe.block_id
  JOIN program_days pd ON pd.id = pb.day_id
  JOIN program_weeks pw ON pw.id = pd.week_id
  JOIN active_programs ap ON ap.program_id = pw.program_id
  WHERE pb.training_type = 'str'
    AND pd.day_number = 1
    AND pw.week_number IN (1,2,3,4)
    AND pe.exercise_id = 'd85f01d1-73a7-4b5b-9d72-4ac3b8d4802b'
),
latest_1rm AS (
  SELECT DISTINCT ON (user_id) user_id, weight
  FROM user_exercise_1rm
  WHERE exercise_id = '299a5179-d18a-48af-b18d-36a7715971e3'
  ORDER BY user_id, recorded_date DESC
),
with_1rm AS (
  SELECT tp.pe_id, tp.percentage_1rm, l.weight AS dl_1rm
  FROM target_pe tp
  LEFT JOIN latest_1rm l ON l.user_id = tp.user_id
)
UPDATE program_exercises pe
SET exercise_id = '299a5179-d18a-48af-b18d-36a7715971e3',
    kg = CASE
      WHEN w.dl_1rm IS NOT NULL AND w.percentage_1rm IS NOT NULL THEN
        (
          CASE
            WHEN (ROUND(w.dl_1rm * w.percentage_1rm / 100.0))::int % 2 = 0
              THEN (ROUND(w.dl_1rm * w.percentage_1rm / 100.0))::int
            ELSE (ROUND(w.dl_1rm * w.percentage_1rm / 100.0))::int - 1
          END
        )::text
      ELSE pe.kg
    END
FROM with_1rm w
WHERE pe.id = w.pe_id;
