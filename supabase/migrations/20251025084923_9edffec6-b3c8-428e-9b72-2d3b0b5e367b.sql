-- Create table for exercise-to-exercise relationships
CREATE TABLE IF NOT EXISTS public.exercise_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  related_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'mobility',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exercise_id, related_exercise_id)
);

-- Enable RLS
ALTER TABLE public.exercise_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view exercise relationships"
  ON public.exercise_relationships
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create exercise relationships"
  ON public.exercise_relationships
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exercise relationships"
  ON public.exercise_relationships
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exercise relationships"
  ON public.exercise_relationships
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Add index for performance
CREATE INDEX idx_exercise_relationships_exercise_id ON public.exercise_relationships(exercise_id);
CREATE INDEX idx_exercise_relationships_related_exercise_id ON public.exercise_relationships(related_exercise_id);