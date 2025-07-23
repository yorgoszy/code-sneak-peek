-- Create a default booking section for videocalls
INSERT INTO public.booking_sections (id, name, description, max_capacity, is_active)
VALUES (
  'videocall-session',
  'Βιντεοκλήσεις', 
  'Προεπιλεγμένη ενότητα για βιντεοκλήσεις',
  1,
  true
)
ON CONFLICT (id) DO NOTHING;