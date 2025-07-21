-- Add status and scheduled_date columns to articles table
ALTER TABLE public.articles 
ADD COLUMN status text NOT NULL DEFAULT 'published',
ADD COLUMN scheduled_date date DEFAULT NULL;

-- Update existing articles to have published status
UPDATE public.articles SET status = 'published' WHERE status IS NULL;