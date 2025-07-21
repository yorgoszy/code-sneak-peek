-- Create results table for managing results with bilingual content
CREATE TABLE public.results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  
  -- Date and status
  result_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'published'::text,
  
  -- Image
  image_url text,
  
  -- Bilingual content
  title_el text NOT NULL,
  title_en text,
  content_el text NOT NULL,
  content_en text,
  
  -- Hashtags
  hashtags text
);

-- Enable RLS
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Create policies for results
CREATE POLICY "Admins can manage all results" 
ON public.results 
FOR ALL
USING (EXISTS ( 
  SELECT 1
  FROM app_users
  WHERE app_users.auth_user_id = auth.uid() 
    AND app_users.role::text = 'admin'::text
));

CREATE POLICY "Everyone can view published results" 
ON public.results 
FOR SELECT
USING (status = 'published'::text);

-- Create trigger for updated_at
CREATE TRIGGER update_results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();