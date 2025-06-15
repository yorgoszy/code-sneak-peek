
-- 1. Δημιουργία ενιαίου πίνακα test_sessions
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_label text, -- π.χ. όνομα περιόδου/εβδομάδας (προαιρετικό)
  test_date date NOT NULL, -- βασική ημερομηνία (συνήθως ημερομηνία εκκίνησης)
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ενεργοποίηση RLS
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Πολιτική: ο καθένας βλέπει ΜΟΝΟ τα δικά του (εδώ admin/manual μέχρι να έχεις auth με user_id)
CREATE POLICY "Allow access to test_sessions for all" ON public.test_sessions
  FOR SELECT USING (true);
CREATE POLICY "Allow insert to test_sessions for all" ON public.test_sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to test_sessions for all" ON public.test_sessions
  FOR UPDATE USING (true);

-- 2. Προσθήκη test_session_id στις επιμέρους "data" (αν δεν υπάρχει ήδη)

ALTER TABLE public.anthropometric_test_data ADD COLUMN IF NOT EXISTS test_session_id uuid;
ALTER TABLE public.functional_test_data ADD COLUMN IF NOT EXISTS test_session_id uuid;
ALTER TABLE public.endurance_test_data ADD COLUMN IF NOT EXISTS test_session_id uuid;
ALTER TABLE public.jump_test_data ADD COLUMN IF NOT EXISTS test_session_id uuid;

-- strength_test_sessions θα καταργηθεί ως επιμέρους "κεφαλίδα" και θα αντικατασταθεί από δεδομένα ανά session
-- Θα μπορούσε να γίνει νέο table "strength_test_data" ΟΠΩΣ ΚΑΙ τα άλλα, ή, να έχει test_session_id ως FK.

-- 3. Δημιουργία index & foreign key σχέσεων
ALTER TABLE public.anthropometric_test_data
  ADD CONSTRAINT fk_anthropometric_test_data_session
  FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);

ALTER TABLE public.functional_test_data
  ADD CONSTRAINT fk_functional_test_data_session
  FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);

ALTER TABLE public.endurance_test_data
  ADD CONSTRAINT fk_endurance_test_data_session
  FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);

ALTER TABLE public.jump_test_data
  ADD CONSTRAINT fk_jump_test_data_session
  FOREIGN KEY (test_session_id) REFERENCES public.test_sessions(id);

-- Προαιρετικό: Διόρθωση/αναβάθμιση strength_test_sessions -> strength_test_data για ενιαία λογική:
CREATE TABLE IF NOT EXISTS public.strength_test_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id uuid REFERENCES public.test_sessions(id),
  exercise_id uuid NOT NULL,
  attempt_number integer NOT NULL,
  weight_kg numeric,
  velocity_ms numeric,
  is_1rm boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Εναλλακτικά, μπορείς να μεταφέρεις υπάρχοντα δεδομένα/προσαρμόσεις στο χέρι.

-- 4. Ενημέρωση indexes κατάλληλα (αν χρειάζεται, ανάλογα με τα queries σου) -- προαιρετικό εδώ.

