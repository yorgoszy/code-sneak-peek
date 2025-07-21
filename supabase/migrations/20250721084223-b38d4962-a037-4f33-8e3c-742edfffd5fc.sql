-- Create storage bucket for articles
INSERT INTO storage.buckets (id, name, public) 
VALUES ('articles', 'articles', true);

-- Create policies for article images
CREATE POLICY "Anyone can view article images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'articles');

CREATE POLICY "Admins can upload article images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'articles' 
  AND EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update article images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'articles' 
  AND EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete article images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'articles' 
  AND EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);