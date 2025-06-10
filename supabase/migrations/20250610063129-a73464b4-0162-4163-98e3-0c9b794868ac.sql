
-- Ενεργοποίηση RLS για τον πίνακα exercises (αν δεν είναι ήδη ενεργοποιημένο)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Πολιτική για να μπορούν όλοι οι authenticated χρήστες να βλέπουν τις ασκήσεις
CREATE POLICY "Anyone can view exercises" 
ON public.exercises 
FOR SELECT 
TO authenticated 
USING (true);

-- Πολιτική για να μπορούν όλοι οι authenticated χρήστες να προσθέτουν ασκήσεις
CREATE POLICY "Anyone can insert exercises" 
ON public.exercises 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Πολιτική για να μπορούν όλοι οι authenticated χρήστες να ενημερώνουν ασκήσεις
CREATE POLICY "Anyone can update exercises" 
ON public.exercises 
FOR UPDATE 
TO authenticated 
USING (true);

-- Πολιτική για να μπορούν όλοι οι authenticated χρήστες να διαγράφουν ασκήσεις
CREATE POLICY "Anyone can delete exercises" 
ON public.exercises 
FOR DELETE 
TO authenticated 
USING (true);

-- Ίδιες πολιτικές για τον πίνακα exercise_categories
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise categories" 
ON public.exercise_categories 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Anyone can insert exercise categories" 
ON public.exercise_categories 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Ίδιες πολιτικές για τον πίνακα exercise_to_category
ALTER TABLE public.exercise_to_category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise to category relations" 
ON public.exercise_to_category 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Anyone can insert exercise to category relations" 
ON public.exercise_to_category 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Anyone can delete exercise to category relations" 
ON public.exercise_to_category 
FOR DELETE 
TO authenticated 
USING (true);
