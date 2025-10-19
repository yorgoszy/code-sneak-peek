-- Add child_id to school_notes table
ALTER TABLE public.school_notes 
ADD COLUMN child_id UUID REFERENCES public.children(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_school_notes_child_id ON public.school_notes(child_id);

-- Add child_age column to store calculated age at time of note creation
ALTER TABLE public.school_notes 
ADD COLUMN child_age INTEGER;