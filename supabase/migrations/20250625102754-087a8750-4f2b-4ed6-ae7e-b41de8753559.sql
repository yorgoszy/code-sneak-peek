
-- Add group assignment support to program_assignments table
ALTER TABLE public.program_assignments 
ADD COLUMN IF NOT EXISTS is_group_assignment boolean DEFAULT false;

-- Create a table to track individual assignments from group assignments
CREATE TABLE IF NOT EXISTS public.group_assignment_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_assignment_id uuid NOT NULL REFERENCES public.program_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  individual_assignment_id uuid REFERENCES public.program_assignments(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_assignment_id, user_id)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_group_assignment_users_group_id ON public.group_assignment_users(group_assignment_id);
CREATE INDEX IF NOT EXISTS idx_group_assignment_users_user_id ON public.group_assignment_users(user_id);

-- Enable RLS for the new table
ALTER TABLE public.group_assignment_users ENABLE ROW LEVEL SECURITY;
