-- Δημιουργία πίνακα για μέλη ομάδων αν δεν υπάρχει
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for group members
CREATE POLICY "Users can view group memberships" 
ON public.group_members 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage group memberships" 
ON public.group_members 
FOR ALL 
USING (true);