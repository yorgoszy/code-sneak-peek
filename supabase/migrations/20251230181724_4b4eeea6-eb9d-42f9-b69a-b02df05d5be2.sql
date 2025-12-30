-- Delete the exercise_to_category relations first
DELETE FROM exercise_to_category 
WHERE category_id IN (
  'ba95f6e4-b750-4583-83d7-78244a37408f',
  '0ba8d0ef-f268-4cb4-8f8a-77410401a904'
);

-- Delete the categories
DELETE FROM exercise_categories 
WHERE id IN (
  'ba95f6e4-b750-4583-83d7-78244a37408f',
  '0ba8d0ef-f268-4cb4-8f8a-77410401a904'
);