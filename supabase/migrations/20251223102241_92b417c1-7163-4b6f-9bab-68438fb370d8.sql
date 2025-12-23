-- Add new columns to phase_rep_schemes for exercise stats like program builder
ALTER TABLE public.phase_rep_schemes 
ADD COLUMN IF NOT EXISTS kg TEXT,
ADD COLUMN IF NOT EXISTS velocity_ms TEXT,
ADD COLUMN IF NOT EXISTS reps_mode TEXT DEFAULT 'reps',
ADD COLUMN IF NOT EXISTS kg_mode TEXT DEFAULT 'kg';