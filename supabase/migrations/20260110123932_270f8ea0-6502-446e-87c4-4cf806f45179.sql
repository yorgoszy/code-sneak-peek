-- Create table for AI Coach test results
CREATE TABLE public.ai_coach_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL, -- e.g., 'deep_squat', 'hurdle_step', 'inline_lunge', etc.
  test_side TEXT, -- 'left', 'right', or null for bilateral tests
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 3),
  feedback TEXT, -- AI-generated feedback
  video_url TEXT, -- Optional recorded video URL
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_coach_test_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own results
CREATE POLICY "Users can view own AI Coach results"
ON public.ai_coach_test_results
FOR SELECT
USING (auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE id = user_id
));

-- Policy: Users can insert their own results
CREATE POLICY "Users can insert own AI Coach results"
ON public.ai_coach_test_results
FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT auth_user_id FROM public.app_users WHERE id = user_id
));

-- Policy: Admins/coaches can view all results
CREATE POLICY "Admins can view all AI Coach results"
ON public.ai_coach_test_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'coach', 'trainer')
  )
);

-- Policy: Admins/coaches can insert results for any user
CREATE POLICY "Admins can insert AI Coach results"
ON public.ai_coach_test_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'coach', 'trainer')
  )
);

-- Create index for faster queries
CREATE INDEX idx_ai_coach_results_user_id ON public.ai_coach_test_results(user_id);
CREATE INDEX idx_ai_coach_results_test_date ON public.ai_coach_test_results(test_date DESC);
CREATE INDEX idx_ai_coach_results_test_type ON public.ai_coach_test_results(test_type);

-- Trigger for updated_at
CREATE TRIGGER update_ai_coach_test_results_updated_at
BEFORE UPDATE ON public.ai_coach_test_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();