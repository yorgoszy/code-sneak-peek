-- Δημιουργία πίνακα για acknowledged χρήστες
CREATE TABLE IF NOT EXISTS public.acknowledged_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, user_id)
);

-- Enable RLS
ALTER TABLE public.acknowledged_users ENABLE ROW LEVEL SECURITY;

-- Admins can manage their own acknowledged users
CREATE POLICY "Admins can manage their acknowledged users"
ON public.acknowledged_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = acknowledged_users.admin_user_id
    AND app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- Index για καλύτερη απόδοση
CREATE INDEX idx_acknowledged_users_admin ON public.acknowledged_users(admin_user_id);
CREATE INDEX idx_acknowledged_users_user ON public.acknowledged_users(user_id);