-- Πίνακας για sprint timing sessions
CREATE TABLE public.sprint_timing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.app_users(id),
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, active, completed
  distance_meters DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Πίνακας για sprint timing results
CREATE TABLE public.sprint_timing_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sprint_timing_sessions(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sprint_timing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_timing_results ENABLE ROW LEVEL SECURITY;

-- Policies για sprint_timing_sessions
CREATE POLICY "Anyone can view sprint sessions"
ON public.sprint_timing_sessions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create sessions"
ON public.sprint_timing_sessions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sessions"
ON public.sprint_timing_sessions
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Policies για sprint_timing_results
CREATE POLICY "Anyone can view sprint results"
ON public.sprint_timing_results
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create results"
ON public.sprint_timing_results
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes για performance
CREATE INDEX idx_sprint_sessions_code ON public.sprint_timing_sessions(session_code);
CREATE INDEX idx_sprint_results_session ON public.sprint_timing_results(session_id);

-- Trigger για updated_at
CREATE TRIGGER update_sprint_sessions_updated_at
BEFORE UPDATE ON public.sprint_timing_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sprint_timing_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE sprint_timing_results;

-- Replica identity για realtime
ALTER TABLE sprint_timing_sessions REPLICA IDENTITY FULL;
ALTER TABLE sprint_timing_results REPLICA IDENTITY FULL;