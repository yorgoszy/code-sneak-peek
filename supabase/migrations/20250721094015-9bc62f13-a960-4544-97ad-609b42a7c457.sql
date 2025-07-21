-- Modify articles table to support bilingual content
ALTER TABLE public.articles 
DROP COLUMN language,
ADD COLUMN title_en text,
ADD COLUMN excerpt_en text,
ADD COLUMN content_en text;

-- Rename existing columns to be explicit about Greek content
ALTER TABLE public.articles 
RENAME COLUMN title TO title_el;
ALTER TABLE public.articles 
RENAME COLUMN excerpt TO excerpt_el;
ALTER TABLE public.articles 
RENAME COLUMN content TO content_el;

-- Update RLS policies to work with new structure
DROP POLICY IF EXISTS "Everyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can manage all articles" ON public.articles;

-- Create new policies
CREATE POLICY "Everyone can view published articles" 
ON public.articles 
FOR SELECT 
USING (status = 'published' OR (status = 'scheduled' AND scheduled_date <= CURRENT_DATE));

CREATE POLICY "Admins can manage all articles" 
ON public.articles 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM app_users 
  WHERE auth_user_id = auth.uid() 
  AND role = 'admin'
));