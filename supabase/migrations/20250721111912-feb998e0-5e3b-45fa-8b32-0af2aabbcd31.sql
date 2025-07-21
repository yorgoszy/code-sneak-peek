-- Fix RLS policies for ai-chat-files bucket storage
DROP POLICY IF EXISTS "Users can upload their own AI chat files" ON storage.objects;

-- Create correct INSERT policy with proper WITH CHECK
CREATE POLICY "Users can upload their own AI chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create UPDATE policy for ai-chat-files bucket  
CREATE POLICY "Users can update their own AI chat files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);