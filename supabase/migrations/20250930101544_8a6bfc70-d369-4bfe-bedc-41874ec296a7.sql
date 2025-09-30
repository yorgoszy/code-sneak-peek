-- Repair program structure for program b7eeff92-94ed-481d-b616-c76b40ebf0b3
-- Ensure weeks 2..5 exist by cloning week 1's structure

-- 1) Create missing weeks 2..5
INSERT INTO program_weeks (id, program_id, name, week_number)
SELECT 
  gen_random_uuid(),
  p.program_id,
  'Εβδομάδα ' || gs::text,
  gs
FROM (SELECT 'b7eeff92-94ed-481d-b616-c76b40ebf0b3'::uuid AS program_id) p
CROSS JOIN generate_series(2,5) gs
LEFT JOIN program_weeks pw ON pw.program_id = p.program_id AND pw.week_number = gs
WHERE pw.id IS NULL;

-- 2) Create days for new weeks based on week 1
INSERT INTO program_days (id, week_id, name, day_number, estimated_duration_minutes)
SELECT 
  gen_random_uuid(),
  nw.id,
  od.name,
  od.day_number,
  COALESCE(od.estimated_duration_minutes, 60)
FROM program_weeks nw
JOIN program_weeks ow ON ow.program_id = nw.program_id AND ow.week_number = 1
JOIN program_days od ON od.week_id = ow.id
WHERE nw.program_id = 'b7eeff92-94ed-481d-b616-c76b40ebf0b3'
  AND nw.week_number BETWEEN 2 AND 5
  AND NOT EXISTS (
    SELECT 1 FROM program_days pd 
    WHERE pd.week_id = nw.id AND pd.day_number = od.day_number
  );

-- 3) Create blocks for each new day based on original day's blocks
INSERT INTO program_blocks (id, day_id, name, block_order)
SELECT 
  gen_random_uuid(),
  nd.id,
  ob.name,
  ob.block_order
FROM program_weeks nw
JOIN program_days nd ON nd.week_id = nw.id
JOIN program_weeks ow ON ow.program_id = nw.program_id AND ow.week_number = 1
JOIN program_days od ON od.week_id = ow.id AND od.day_number = nd.day_number
JOIN program_blocks ob ON ob.day_id = od.id
WHERE nw.program_id = 'b7eeff92-94ed-481d-b616-c76b40ebf0b3'
  AND nw.week_number BETWEEN 2 AND 5
  AND NOT EXISTS (
    SELECT 1 FROM program_blocks pb 
    WHERE pb.day_id = nd.id AND pb.block_order = ob.block_order
  );

-- 4) Create exercises for each new block based on original block's exercises
INSERT INTO program_exercises (id, block_id, exercise_id, sets, reps, kg, percentage_1rm, velocity_ms, tempo, rest, notes, exercise_order)
SELECT 
  gen_random_uuid(),
  nb.id,
  pe.exercise_id,
  pe.sets,
  pe.reps,
  pe.kg,
  pe.percentage_1rm,
  pe.velocity_ms,
  pe.tempo,
  pe.rest,
  pe.notes,
  pe.exercise_order
FROM program_weeks nw
JOIN program_days nd ON nd.week_id = nw.id
JOIN program_blocks nb ON nb.day_id = nd.id
JOIN program_weeks ow ON ow.program_id = nw.program_id AND ow.week_number = 1
JOIN program_days od ON od.week_id = ow.id AND od.day_number = nd.day_number
JOIN program_blocks ob ON ob.day_id = od.id AND ob.block_order = nb.block_order
JOIN program_exercises pe ON pe.block_id = ob.id
WHERE nw.program_id = 'b7eeff92-94ed-481d-b616-c76b40ebf0b3'
  AND nw.week_number BETWEEN 2 AND 5
  AND NOT EXISTS (
    SELECT 1 FROM program_exercises x 
    WHERE x.block_id = nb.id AND x.exercise_order = pe.exercise_order
  );