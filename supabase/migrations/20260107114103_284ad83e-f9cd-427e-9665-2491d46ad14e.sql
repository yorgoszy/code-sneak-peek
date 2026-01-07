-- Create block_templates table
CREATE TABLE public.block_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  training_type TEXT,
  workout_format TEXT,
  workout_duration TEXT,
  block_sets INTEGER DEFAULT 1,
  exercises JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.block_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all block templates" 
ON public.block_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create block templates" 
ON public.block_templates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own block templates" 
ON public.block_templates 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete their own block templates" 
ON public.block_templates 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_block_templates_updated_at
BEFORE UPDATE ON public.block_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();