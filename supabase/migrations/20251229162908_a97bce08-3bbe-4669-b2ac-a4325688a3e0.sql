-- Drop the global unique constraint on expense_number
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_expense_number_key;

-- Create a new composite unique constraint per coach
ALTER TABLE expenses ADD CONSTRAINT expenses_coach_expense_number_unique UNIQUE (coach_id, expense_number);

-- Now fix the expense numbers for coach c6d44641-3b95-46bd-8270-e5ed72de25ad
UPDATE expenses 
SET expense_number = 'ΕΞ-0001' 
WHERE id = '9543b7d2-5a3f-49c5-9cf6-ac0c24d9a8bd';

UPDATE expenses 
SET expense_number = 'ΕΞ-0002' 
WHERE id = '0ec75904-0d7a-4d3c-b520-bb9b5cc19c8c';