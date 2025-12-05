-- Add block_sets column to program_blocks table
ALTER TABLE public.program_blocks 
ADD COLUMN IF NOT EXISTS block_sets integer DEFAULT 1;