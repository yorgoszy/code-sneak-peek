-- Πίνακας για τους χρήστες που δημιουργεί κάθε coach
CREATE TABLE public.coach_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  avatar_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.coach_users ENABLE ROW LEVEL SECURITY;

-- Policies: Ο κάθε coach βλέπει μόνο τους δικούς του χρήστες
CREATE POLICY "Coaches can view their own users"
ON public.coach_users
FOR SELECT
USING (
  coach_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Coaches can insert their own users"
ON public.coach_users
FOR INSERT
WITH CHECK (
  coach_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Coaches can update their own users"
ON public.coach_users
FOR UPDATE
USING (
  coach_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Coaches can delete their own users"
ON public.coach_users
FOR DELETE
USING (
  coach_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

-- Admins can see all
CREATE POLICY "Admins can view all coach users"
ON public.coach_users
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_coach_users_updated_at
  BEFORE UPDATE ON public.coach_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();