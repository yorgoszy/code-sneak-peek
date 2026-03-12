
-- Delete the old generic 40+ template
DELETE FROM federation_category_templates WHERE name = '40+' AND gender = 'mixed';

-- Insert Βετεράνοι 40+ male templates (same weights as adults)
INSERT INTO federation_category_templates (federation_id, name, category_type, gender, min_age, max_age, min_weight, max_weight, sort_order)
VALUES
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -45kg', 'age', 'male', 40, 65, NULL, 45, 245),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -48kg', 'age', 'male', 40, 65, 45, 48, 246),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -51kg', 'age', 'male', 40, 65, 48, 51, 247),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -54kg', 'age', 'male', 40, 65, 51, 54, 248),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -57kg', 'age', 'male', 40, 65, 54, 57, 249),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -60kg', 'age', 'male', 40, 65, 57, 60, 250),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -63.5kg', 'age', 'male', 40, 65, 60, 63.5, 251),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -67kg', 'age', 'male', 40, 65, 63.5, 67, 252),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -71kg', 'age', 'male', 40, 65, 67, 71, 253),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -75kg', 'age', 'male', 40, 65, 71, 75, 254),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -81kg', 'age', 'male', 40, 65, 75, 81, 255),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -86kg', 'age', 'male', 40, 65, 81, 86, 256),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -91kg', 'age', 'male', 40, 65, 86, 91, 257),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ +91kg', 'age', 'male', 40, 65, 91, NULL, 258),
  -- Female
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -45kg', 'age', 'female', 40, 65, NULL, 45, 259),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -48kg', 'age', 'female', 40, 65, 45, 48, 260),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -51kg', 'age', 'female', 40, 65, 48, 51, 261),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -54kg', 'age', 'female', 40, 65, 51, 54, 262),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -57kg', 'age', 'female', 40, 65, 54, 57, 263),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -60kg', 'age', 'female', 40, 65, 57, 60, 264),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -63.5kg', 'age', 'female', 40, 65, 60, 63.5, 265),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -67kg', 'age', 'female', 40, 65, 63.5, 67, 266),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -71kg', 'age', 'female', 40, 65, 67, 71, 267),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ -75kg', 'age', 'female', 40, 65, 71, 75, 268),
  ('d43752c0-fdb4-4d04-9bb4-2c84c0497275', 'Βετεράνοι 40+ +75kg', 'age', 'female', 40, 65, 75, NULL, 269);

-- Enable replica identity FULL on competition_matches for realtime DELETE events with filters
ALTER TABLE competition_matches REPLICA IDENTITY FULL;
