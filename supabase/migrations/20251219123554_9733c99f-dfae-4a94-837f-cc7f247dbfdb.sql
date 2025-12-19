-- Create saved_macrocycles table for storing macrocycle templates
CREATE TABLE public.saved_macrocycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  phases JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_macrocycles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust as needed for your auth setup)
CREATE POLICY "Allow all operations on saved_macrocycles" 
ON public.saved_macrocycles 
FOR ALL 
USING (true)
WITH CHECK (true);