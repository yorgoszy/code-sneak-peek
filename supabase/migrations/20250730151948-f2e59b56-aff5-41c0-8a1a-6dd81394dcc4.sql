-- Fix existing visit packages without allowed_sections for magic box consolations
UPDATE visit_packages 
SET allowed_sections = ARRAY['509179bd-19d5-4990-888c-d41c4d8cc868'::uuid, '5f337b61-cad8-4ec4-9c18-df6b0ae97057'::uuid]
WHERE allowed_sections IS NULL 
  AND status = 'active' 
  AND remaining_visits > 0
  AND price IS NULL -- Consolation visits are free
  AND total_visits = 1; -- Single visit packages from magic box