UPDATE federation_competition_categories
SET name = REPLACE(name, 'Ενήλικοι', '18-40')
WHERE name LIKE 'Ενήλικοι%';