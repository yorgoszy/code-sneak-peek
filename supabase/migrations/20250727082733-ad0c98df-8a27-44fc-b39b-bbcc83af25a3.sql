-- Create uploads bucket for logos and other assets
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Create policies for public access to uploads bucket
CREATE POLICY "Public access to uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');

CREATE POLICY "Public insert to uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads');