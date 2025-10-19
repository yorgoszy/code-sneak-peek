-- Create school_notes table
CREATE TABLE public.school_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_summary TEXT,
  ai_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_notes ENABLE ROW LEVEL SECURITY;

-- Parents can create notes for their children
CREATE POLICY "Parents can create notes for their children"
ON public.school_notes
FOR INSERT
WITH CHECK (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'parent'
  )
);

-- Parents can view their own notes
CREATE POLICY "Parents can view their own notes"
ON public.school_notes
FOR SELECT
USING (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Parents can update their own notes
CREATE POLICY "Parents can update their own notes"
ON public.school_notes
FOR UPDATE
USING (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Parents can delete their own notes
CREATE POLICY "Parents can delete their own notes"
ON public.school_notes
FOR DELETE
USING (
  parent_id IN (
    SELECT id FROM public.app_users 
    WHERE auth_user_id = auth.uid()
  )
);

-- Admins can manage all notes
CREATE POLICY "Admins can manage all school notes"
ON public.school_notes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_school_notes_updated_at
BEFORE UPDATE ON public.school_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_school_notes_user_id ON public.school_notes(user_id);
CREATE INDEX idx_school_notes_parent_id ON public.school_notes(parent_id);
CREATE INDEX idx_school_notes_category ON public.school_notes(category);