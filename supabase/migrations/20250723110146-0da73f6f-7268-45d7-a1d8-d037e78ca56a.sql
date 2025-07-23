-- Create a default booking section for videocalls with proper UUID
INSERT INTO public.booking_sections (id, name, description, max_capacity, is_active)
VALUES (
  gen_random_uuid(),
  'Βιντεοκλήσεις', 
  'Προεπιλεγμένη ενότητα για βιντεοκλήσεις',
  1,
  true
);