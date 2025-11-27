-- Add distance_meters column to sprint_timing_results
ALTER TABLE sprint_timing_results 
ADD COLUMN distance_meters INTEGER;

-- Add distances array to sprint_timing_sessions to store configured distances
ALTER TABLE sprint_timing_sessions 
ADD COLUMN distances INTEGER[] DEFAULT ARRAY[10, 20, 30];

-- Add index for querying results by distance
CREATE INDEX idx_sprint_timing_results_distance 
ON sprint_timing_results(session_id, distance_meters);

-- Add comment explaining the structure
COMMENT ON COLUMN sprint_timing_results.distance_meters IS 'Distance in meters for this timing result (e.g., 10m, 20m, 30m)';
COMMENT ON COLUMN sprint_timing_sessions.distances IS 'Array of distances in meters to be measured in this session';