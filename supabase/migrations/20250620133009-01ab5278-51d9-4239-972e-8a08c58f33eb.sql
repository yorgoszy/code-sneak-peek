
-- Πίνακας για αποθήκευση συνομιλιών AI
CREATE TABLE public.ai_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  message_type text NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Πίνακας για αποθήκευση εξατομικευμένων δεδομένων AI ανά χρήστη
CREATE TABLE public.ai_user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE UNIQUE,
  goals jsonb DEFAULT '{}', -- στόχοι χρήστη (αδυνάτισμα, όγκος κτλ)
  medical_conditions jsonb DEFAULT '{}', -- ιατρικά προβλήματα (διαβήτης κτλ)
  dietary_preferences jsonb DEFAULT '{}', -- διατροφικές προτιμήσεις
  habits jsonb DEFAULT '{}', -- συνήθειες που έμαθε το AI
  preferences jsonb DEFAULT '{}', -- προτιμήσεις χρήστη
  learned_corrections jsonb DEFAULT '{}', -- διορθώσεις που έκανε ο χρήστης
  last_nutrition_advice jsonb DEFAULT '{}', -- τελευταία διατροφική συμβουλή
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Πίνακας για γενική μάθηση AI (για όλους τους χρήστες)
CREATE TABLE public.ai_global_knowledge (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_type text NOT NULL, -- 'correction', 'fact', 'preference' κτλ
  category text NOT NULL, -- 'nutrition', 'exercise', 'medical' κτλ
  original_info text NOT NULL, -- η αρχική πληροφορία που ήταν λάθος
  corrected_info text NOT NULL, -- η διορθωμένη πληροφορία
  confidence_score integer DEFAULT 1, -- πόσες φορές επιβεβαιώθηκε
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ευρετήρια για απόδοση
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);
CREATE INDEX idx_ai_user_profiles_user_id ON public.ai_user_profiles(user_id);
CREATE INDEX idx_ai_global_knowledge_category ON public.ai_global_knowledge(category);
CREATE INDEX idx_ai_global_knowledge_type ON public.ai_global_knowledge(knowledge_type);

-- Trigger για ενημέρωση updated_at
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_user_profiles_updated_at
  BEFORE UPDATE ON public.ai_user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER ai_global_knowledge_updated_at
  BEFORE UPDATE ON public.ai_global_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_ai_updated_at();

-- RLS policies
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_global_knowledge ENABLE ROW LEVEL SECURITY;

-- Οι χρήστες μπορούν να βλέπουν μόνο τις δικές τους συνομιλίες
CREATE POLICY "Users can access their own conversations" ON public.ai_conversations
  FOR ALL USING (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

-- Οι χρήστες μπορούν να βλέπουν μόνο το δικό τους AI προφίλ
CREATE POLICY "Users can access their own AI profile" ON public.ai_user_profiles
  FOR ALL USING (user_id IN (
    SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()
  ));

-- Όλοι μπορούν να διαβάζουν τη γενική γνώση (για μάθηση AI)
CREATE POLICY "Everyone can read global knowledge" ON public.ai_global_knowledge
  FOR SELECT USING (true);

-- Μόνο admins μπορούν να ενημερώνουν τη γενική γνώση
CREATE POLICY "Only admins can modify global knowledge" ON public.ai_global_knowledge
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );
