-- Create storage bucket for temporary AI chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-chat-files', 'ai-chat-files', false);

-- Create policies for AI chat files
CREATE POLICY "Users can upload their own AI chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own AI chat files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own AI chat files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ai-chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track temporary files for cleanup
CREATE TABLE public.ai_chat_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '2 days')
);

-- Enable RLS
ALTER TABLE public.ai_chat_files ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_chat_files
CREATE POLICY "Users can view their own chat files" 
ON public.ai_chat_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat files" 
ON public.ai_chat_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat files" 
ON public.ai_chat_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to cleanup expired files
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_chat_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_file RECORD;
BEGIN
  -- Find expired files
  FOR expired_file IN 
    SELECT file_path FROM public.ai_chat_files 
    WHERE expires_at < now()
  LOOP
    -- Delete from storage
    PERFORM storage.delete(expired_file.file_path);
  END LOOP;
  
  -- Delete expired records
  DELETE FROM public.ai_chat_files WHERE expires_at < now();
END;
$$;