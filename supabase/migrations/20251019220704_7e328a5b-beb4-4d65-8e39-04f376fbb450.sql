-- Create children table for parents
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on children table
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Parents can view their own children
CREATE POLICY "Parents can view their own children"
ON public.children
FOR SELECT
USING (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Parents can insert their own children
CREATE POLICY "Parents can insert their own children"
ON public.children
FOR INSERT
WITH CHECK (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Parents can update their own children
CREATE POLICY "Parents can update their own children"
ON public.children
FOR UPDATE
USING (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Parents can delete their own children
CREATE POLICY "Parents can delete their own children"
ON public.children
FOR DELETE
USING (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Admins can manage all children
CREATE POLICY "Admins can manage all children"
ON public.children
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- Add comment
COMMENT ON TABLE public.children IS 'Stores children information for parent users';