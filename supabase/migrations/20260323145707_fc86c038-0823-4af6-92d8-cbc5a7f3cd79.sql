-- Drop overly broad authenticated write policies on stretches
DROP POLICY IF EXISTS "Authenticated users can create stretches" ON stretches;
DROP POLICY IF EXISTS "Authenticated users can update stretches" ON stretches;
DROP POLICY IF EXISTS "Authenticated users can delete stretches" ON stretches;

-- Drop overly broad authenticated write policies on exercise_stretches
DROP POLICY IF EXISTS "Authenticated users can create exercise_stretches" ON exercise_stretches;
DROP POLICY IF EXISTS "Authenticated users can update exercise_stretches" ON exercise_stretches;
DROP POLICY IF EXISTS "Authenticated users can delete exercise_stretches" ON exercise_stretches;

-- Drop overly broad authenticated write policies on exercise_relationships
DROP POLICY IF EXISTS "Authenticated users can create exercise_relationships" ON exercise_relationships;
DROP POLICY IF EXISTS "Authenticated users can update exercise_relationships" ON exercise_relationships;
DROP POLICY IF EXISTS "Authenticated users can delete exercise_relationships" ON exercise_relationships;