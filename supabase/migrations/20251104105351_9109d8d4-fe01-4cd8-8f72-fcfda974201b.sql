-- Add is_template column to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Create index for faster filtering of templates
CREATE INDEX IF NOT EXISTS idx_programs_is_template ON public.programs(is_template) WHERE is_template = true;

-- Update RLS policies to allow templates to be managed by admins
-- Templates are programs that are not assigned to specific users but used as starting points