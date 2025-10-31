-- Δημιουργία πίνακα competitions για αγώνες αθλητών
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  competition_date DATE NOT NULL,
  name TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Policies για admins - μπορούν να δουν και να επεξεργαστούν όλα
CREATE POLICY "Admins can view all competitions"
ON public.competitions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

CREATE POLICY "Admins can insert competitions"
ON public.competitions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

CREATE POLICY "Admins can update competitions"
ON public.competitions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

CREATE POLICY "Admins can delete competitions"
ON public.competitions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- Policy για χρήστες - μπορούν να δουν μόνο τους δικούς τους αγώνες
CREATE POLICY "Users can view their own competitions"
ON public.competitions
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.app_users
    WHERE app_users.auth_user_id = auth.uid()
  )
);

-- Trigger για αυτόματη ενημέρωση updated_at
CREATE TRIGGER update_competitions_updated_at
BEFORE UPDATE ON public.competitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index για γρηγορότερες αναζητήσεις
CREATE INDEX idx_competitions_user_id ON public.competitions(user_id);
CREATE INDEX idx_competitions_date ON public.competitions(competition_date);
