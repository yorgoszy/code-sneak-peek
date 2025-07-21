-- Create articles table
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  bibliography text,
  image_url text,
  published_date date NOT NULL DEFAULT CURRENT_DATE,
  language text NOT NULL DEFAULT 'el',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view published articles" 
ON public.articles 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage all articles" 
ON public.articles 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() 
  AND role = 'admin'
));

-- Create trigger for updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();