-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public)
VALUES ('models', 'models', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the models bucket (public)
CREATE POLICY "Public read access for models"
ON storage.objects FOR SELECT
USING (bucket_id = 'models');

-- Allow authenticated users to upload models
CREATE POLICY "Authenticated users can upload models"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'models' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own models
CREATE POLICY "Authenticated users can delete models"
ON storage.objects FOR DELETE
USING (bucket_id = 'models' AND auth.role() = 'authenticated');