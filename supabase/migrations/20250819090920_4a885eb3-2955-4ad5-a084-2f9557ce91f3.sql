-- Δημιουργία πίνακα για shared exercise notes ανάμεσα σε εβδομάδες
CREATE TABLE IF NOT EXISTS public.exercise_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  exercise_id UUID NOT NULL, -- Reference στον κατάλογο ασκήσεων  
  day_number INTEGER NOT NULL, -- Η ημέρα της εβδομάδας (1, 2, 3, etc.)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint για να έχουμε μία εγγραφή ανά assignment/exercise/day
  UNIQUE(assignment_id, exercise_id, day_number)
);

-- Ενεργοποίηση RLS
ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own exercise notes" 
ON public.exercise_notes 
FOR SELECT 
USING (
  assignment_id IN (
    SELECT id FROM public.program_assignments 
    WHERE user_id IN (
      SELECT id FROM public.app_users 
      WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create their own exercise notes" 
ON public.exercise_notes 
FOR INSERT 
WITH CHECK (
  assignment_id IN (
    SELECT id FROM public.program_assignments 
    WHERE user_id IN (
      SELECT id FROM public.app_users 
      WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own exercise notes" 
ON public.exercise_notes 
FOR UPDATE 
USING (
  assignment_id IN (
    SELECT id FROM public.program_assignments 
    WHERE user_id IN (
      SELECT id FROM public.app_users 
      WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own exercise notes" 
ON public.exercise_notes 
FOR DELETE 
USING (
  assignment_id IN (
    SELECT id FROM public.program_assignments 
    WHERE user_id IN (
      SELECT id FROM public.app_users 
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Admins can manage all exercise notes
CREATE POLICY "Admins can manage all exercise notes" 
ON public.exercise_notes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Trigger για automatic updated_at
CREATE OR REPLACE FUNCTION public.update_exercise_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercise_notes_updated_at
  BEFORE UPDATE ON public.exercise_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exercise_notes_updated_at();