-- Insert missing training phases
INSERT INTO training_phase_config (phase_key, phase_name, phase_type, description)
VALUES 
  ('stabilization', 'Stabilization Training', 'foundation', 'Core stability and balance development'),
  ('connecting-linking', 'Connecting Linking', 'foundation', 'Movement pattern integration and coordination'),
  ('movement-skills', 'Movement Skills', 'foundation', 'Fundamental movement pattern development'),
  ('non-functional-hypertrophy', 'Non-Functional Hypertrophy', 'hypertrophy', 'Maximum muscle size - metabolic stress focus'),
  ('functional-hypertrophy', 'Functional Hypertrophy', 'hypertrophy', 'Muscle size with neural efficiency')
ON CONFLICT (phase_key) DO NOTHING;