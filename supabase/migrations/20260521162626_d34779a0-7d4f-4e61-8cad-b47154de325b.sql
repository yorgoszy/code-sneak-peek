UPDATE program_exercises pe
SET exercise_id = 'd85f01d1-73a7-4b5b-9d72-4ac3b8d4802b'
FROM program_blocks pb
JOIN program_days pd ON pd.id = pb.day_id
JOIN program_weeks pw ON pw.id = pd.week_id
WHERE pe.block_id = pb.id
  AND pe.exercise_id = '299a5179-d18a-48af-b18d-36a7715971e3'
  AND lower(pb.name) = 'str'
  AND pw.week_number IN (1,2,3,4)
  AND pw.program_id IN (
    'a5e37d5f-62a3-4610-b7da-ca6c80979eda',
    'da1fc7e5-e366-437f-a737-2436eedfadab',
    '1ccf9753-e68a-4f5c-8c65-febb7f03c5ce',
    'ae47a7e6-50f5-4df7-8377-586530b1b325',
    'ae59027a-d2bd-4bbf-bfcc-f00bfed623cb'
  );