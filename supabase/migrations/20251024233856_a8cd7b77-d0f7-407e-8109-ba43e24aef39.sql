-- Δημιουργία πίνακα για διατάσεις
CREATE TABLE public.stretches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Δημιουργία πίνακα σύνδεσης ασκήσεων με διατάσεις (many-to-many)
CREATE TABLE public.exercise_stretches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  stretch_id UUID NOT NULL REFERENCES public.stretches(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exercise_id, stretch_id)
);

-- Enable Row Level Security
ALTER TABLE public.stretches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_stretches ENABLE ROW LEVEL SECURITY;

-- Policies για stretches
CREATE POLICY "Stretches are viewable by everyone"
ON public.stretches
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create stretches"
ON public.stretches
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update stretches"
ON public.stretches
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete stretches"
ON public.stretches
FOR DELETE
USING (auth.role() = 'authenticated');

-- Policies για exercise_stretches
CREATE POLICY "Exercise stretches are viewable by everyone"
ON public.exercise_stretches
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create exercise stretches"
ON public.exercise_stretches
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exercise stretches"
ON public.exercise_stretches
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exercise stretches"
ON public.exercise_stretches
FOR DELETE
USING (auth.role() = 'authenticated');

-- Indexes για καλύτερη απόδοση
CREATE INDEX idx_exercise_stretches_exercise_id ON public.exercise_stretches(exercise_id);
CREATE INDEX idx_exercise_stretches_stretch_id ON public.exercise_stretches(stretch_id);

-- Trigger για updated_at
CREATE TRIGGER update_stretches_updated_at
BEFORE UPDATE ON public.stretches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Εισαγωγή μερικών βασικών διατάσεων
INSERT INTO public.stretches (name, description, duration_seconds) VALUES
('Διάταση Τετρακεφάλου', 'Διάταση για τον τετρακέφαλο μηριαίο μυ', 30),
('Διάταση Οπίσθιων Μηριαίων', 'Διάταση για τους οπίσθιους μηριαίους', 30),
('Διάταση Γλουτών', 'Διάταση για τους γλουτιαίους μύες', 30),
('Διάταση Μέσης', 'Διάταση για τη μέση και τη σπονδυλική στήλη', 30),
('Διάταση Ώμων', 'Διάταση για τους ώμους και το άνω τμήμα της πλάτης', 30),
('Διάταση Στήθους', 'Διάταση για τους θωρακικούς μύες', 30),
('Διάταση Πλάτης', 'Διάταση για τους μύες της πλάτης', 30),
('Διάταση Βραχιονίων', 'Διάταση για τους βραχιόνιους μύες', 30),
('Διάταση Κνημιαίων', 'Διάταση για τους κνημιαίους μύες', 30),
('Διάταση Αυχένα', 'Διάταση για τον αυχένα', 30);