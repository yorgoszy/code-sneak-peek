-- Create strength_test_data table to replace old strength_test_attempts
CREATE TABLE IF NOT EXISTS public.strength_test_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  weight_kg NUMERIC NOT NULL,
  velocity_ms NUMERIC,
  is_1rm BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strength_test_data ENABLE ROW LEVEL SECURITY;

-- Create policies for strength_test_data
CREATE POLICY "Users can access own strength_test_data" 
ON public.strength_test_data 
FOR ALL 
USING (
  (SELECT user_id FROM test_sessions WHERE test_sessions.id = strength_test_data.test_session_id LIMIT 1) = auth.uid()
)
WITH CHECK (
  (SELECT user_id FROM test_sessions WHERE test_sessions.id = strength_test_data.test_session_id LIMIT 1) = auth.uid()
);