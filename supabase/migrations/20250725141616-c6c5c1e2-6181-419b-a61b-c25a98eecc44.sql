-- Add allowed_sections to visit_packages table
ALTER TABLE public.visit_packages 
ADD COLUMN allowed_sections UUID[] DEFAULT NULL;