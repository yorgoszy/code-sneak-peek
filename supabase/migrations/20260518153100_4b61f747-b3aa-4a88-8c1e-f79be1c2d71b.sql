
WITH assignment_users AS (
  SELECT pa.program_id, pa.user_id
  FROM program_assignments pa
),
-- Build symmetric strength_variant link map
links AS (
  SELECT exercise_id AS a, related_exercise_id AS b
  FROM exercise_relationships WHERE relationship_type='strength_variant'
  UNION
  SELECT related_exercise_id AS a, exercise_id AS b
  FROM exercise_relationships WHERE relationship_type='strength_variant'
),
-- Latest 1RM per (user, exercise)
latest_rm AS (
  SELECT DISTINCT ON (user_id, exercise_id) user_id, exercise_id, weight
  FROM user_exercise_1rm
  ORDER BY user_id, exercise_id, recorded_date DESC
),
-- For each program_exercise needing kg, find applicable 1RM (direct or via 1-hop link)
candidates AS (
  SELECT
    pe.id AS pe_id,
    pe.percentage_1rm,
    au.user_id,
    COALESCE(
      (SELECT weight FROM latest_rm r WHERE r.user_id = au.user_id AND r.exercise_id = pe.exercise_id LIMIT 1),
      (SELECT r.weight FROM links l JOIN latest_rm r ON r.exercise_id = l.b
         WHERE l.a = pe.exercise_id AND r.user_id = au.user_id LIMIT 1)
    ) AS one_rm
  FROM program_exercises pe
  JOIN program_blocks pb ON pb.id = pe.block_id
  JOIN program_days pd ON pd.id = pb.day_id
  JOIN program_weeks pw ON pw.id = pd.week_id
  JOIN assignment_users au ON au.program_id = pw.program_id
  WHERE pe.percentage_1rm IS NOT NULL
    AND pe.percentage_1rm > 0
    AND (pe.kg IS NULL OR pe.kg = '')
)
UPDATE program_exercises pe
SET kg = REPLACE(
  CASE
    WHEN MOD(ROUND(c.one_rm * c.percentage_1rm / 100.0)::int, 2) = 0
      THEN ROUND(c.one_rm * c.percentage_1rm / 100.0)::int::text
    ELSE (
      CASE
        WHEN ABS((c.one_rm * c.percentage_1rm / 100.0) - (ROUND(c.one_rm * c.percentage_1rm / 100.0)::int - 1))
           < ABS((c.one_rm * c.percentage_1rm / 100.0) - (ROUND(c.one_rm * c.percentage_1rm / 100.0)::int + 1))
        THEN (ROUND(c.one_rm * c.percentage_1rm / 100.0)::int - 1)::text
        ELSE (ROUND(c.one_rm * c.percentage_1rm / 100.0)::int + 1)::text
      END
    )
  END, '.', ',')
FROM candidates c
WHERE pe.id = c.pe_id
  AND c.one_rm IS NOT NULL;
